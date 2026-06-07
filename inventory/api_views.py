from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.utils import timezone
from django.db import transaction
from .models import (
    Medicine, Batch, Sale, SaleItem, ReturnRecord,
    Supplier, Customer, Purchase, PurchaseItem, AuditLog
)
from .serializers import (
    MedicineSerializer, BatchSerializer, SaleSerializer, 
    SaleItemSerializer, ReturnRecordSerializer,
    SupplierSerializer, CustomerSerializer, PurchaseSerializer,
    PurchaseItemSerializer, AuditLogSerializer
)

def log_action(user, action, details=""):
    AuditLog.objects.create(user=user, action=action, details=details)

class UserFilteredViewSetMixin:
    def get_queryset(self):
        return super().get_queryset().filter(user=self.request.user)

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

class SupplierViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Supplier.objects.all()
    serializer_class = SupplierSerializer

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        supplier = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        purchases = Purchase.objects.filter(user=request.user, supplier=supplier).order_by('-purchase_date')
        
        if start_date:
            purchases = purchases.filter(purchase_date__date__gte=start_date)
        if end_date:
            purchases = purchases.filter(purchase_date__date__lte=end_date)
            
        serializer = PurchaseSerializer(purchases, many=True)
        return Response(serializer.data)

class CustomerViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Customer.objects.all()
    serializer_class = CustomerSerializer

    @action(detail=True, methods=['get'])
    def purchase_history(self, request, pk=None):
        customer = self.get_object()
        start_date = request.query_params.get('start_date')
        end_date = request.query_params.get('end_date')
        
        sales = Sale.objects.filter(user=request.user, customer=customer, status='COMPLETED').order_by('-sale_date')
        
        if start_date:
            sales = sales.filter(sale_date__date__gte=start_date)
        if end_date:
            sales = sales.filter(sale_date__date__lte=end_date)
            
        serializer = SaleSerializer(sales, many=True)
        return Response(serializer.data)

class MedicineViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

    @action(detail=True, methods=['get'])
    def alternatives(self, request, pk=None):
        medicine = self.get_object()
        
        # 1. Try matching by generic_name
        alternatives = Medicine.objects.filter(user=request.user)
        if medicine.generic_name:
            alternatives = alternatives.filter(
                generic_name__iexact=medicine.generic_name
            ).exclude(id=medicine.id)
        else:
            alternatives = Medicine.objects.none()

        # 2. If no generic match or if we want more, fallback/add by category
        if not alternatives.exists() and medicine.category:
            alternatives = Medicine.objects.filter(
                user=request.user,
                category__iexact=medicine.category
            ).exclude(id=medicine.id)

        # Filter by stock availability
        # We want medicines that have at least one batch with quantity > 0 and not expired
        available_alternatives = alternatives.filter(
            batches__quantity__gt=0,
            batches__expiry_date__gt=timezone.now().date()
        ).distinct()

        serializer = self.get_serializer(available_alternatives, many=True)
        return Response(serializer.data)

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data.copy() if isinstance(request.data, dict) else dict(request.data)
        
        name = data.get('name', '').strip()
        initial_mrp = data.pop('initial_mrp', 0)
        initial_stock = data.pop('initial_stock', 0)
        batch_number = data.pop('batch_number', '').strip() or 'INITIAL'
        manufacturing_date = data.pop('manufacturing_date', None)
        expiry_date = data.pop('expiry_date', None)
        
        # Robust conversion and validation
        try:
            initial_mrp = float(initial_mrp) if initial_mrp not in [None, ''] else 0
            initial_stock = int(initial_stock) if initial_stock not in [None, ''] else 0
        except (ValueError, TypeError):
            return Response({"error": "Invalid price or stock format. Must be numbers."}, status=status.HTTP_400_BAD_REQUEST)

        if initial_mrp <= 0:
            return Response({"error": "Selling Price (MRP) must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
        if initial_stock < 0:
            return Response({"error": "Stock cannot be negative"}, status=status.HTTP_400_BAD_REQUEST)

        # Handle gst_percentage
        gst_percentage = data.get('gst_percentage')
        if gst_percentage == '' or gst_percentage is None:
            data['gst_percentage'] = 12.0 # Default if empty
        else:
            try:
                data['gst_percentage'] = float(gst_percentage)
            except (ValueError, TypeError):
                return Response({"error": "Invalid GST percentage format"}, status=status.HTTP_400_BAD_REQUEST)

        # Get or Create Medicine (Scoped to User)
        medicine, created = Medicine.objects.get_or_create(
            name__iexact=name,
            user=request.user,
            defaults={
                'name': name,
                'user': request.user,
                'generic_name': data.get('generic_name'),
                'manufacturer': data.get('manufacturer'),
                'category': data.get('category'),
                'description': data.get('description'),
                'gst_percentage': data['gst_percentage']
            }
        )

        if not created:
            # CHECK FOR CONSISTENCY: If medicine exists, check GST
            if float(medicine.gst_percentage) != float(data['gst_percentage']):
                return Response({
                    "error": f"Consistency Error: Medicine '{name}' is already registered with {medicine.gst_percentage}% GST. You provided {data['gst_percentage']}%. Please use the registered GST."
                }, status=status.HTTP_400_BAD_REQUEST)

            # Update medicine details if provided
            medicine.generic_name = data.get('generic_name') or medicine.generic_name
            medicine.manufacturer = data.get('manufacturer') or medicine.manufacturer
            medicine.category = data.get('category') or medicine.category
            medicine.description = data.get('description') or medicine.description
            medicine.save()

        # Check for existing batch consistency (Scoped to User)
        existing_batch = Batch.objects.filter(medicine=medicine, batch_number=batch_number, user=request.user).first()
        if existing_batch:
            # Compare details
            mismatches = []
            if manufacturing_date and str(existing_batch.manufacturing_date) != str(manufacturing_date):
                mismatches.append(f"Manufacturing Date (System: {existing_batch.manufacturing_date}, New: {manufacturing_date})")
            if expiry_date and str(existing_batch.expiry_date) != str(expiry_date):
                mismatches.append(f"Expiry Date (System: {existing_batch.expiry_date}, New: {expiry_date})")
            if float(existing_batch.mrp) != float(initial_mrp):
                mismatches.append(f"MRP/Price (System: ₹{existing_batch.mrp}, New: ₹{initial_mrp})")

            if mismatches:
                return Response({
                    "error": f"Batch Consistency Conflict: Batch '{batch_number}' already exists for '{name}' but with different details:\n" + "\n".join(mismatches) + "\n\nIf this is a new batch with different dates/price, please use a unique batch number."
                }, status=status.HTTP_400_BAD_REQUEST)

            # If consistent, update quantity
            existing_batch.quantity += initial_stock
            existing_batch.save()
            log_action(request.user, "UPDATE_BATCH_STOCK", f"Added {initial_stock} units to batch {batch_number} for {medicine.name}")
        else:
            # Create new batch
            Batch.objects.create(
                medicine=medicine,
                user=request.user,
                batch_number=batch_number,
                manufacturing_date=manufacturing_date if manufacturing_date else None,
                expiry_date=expiry_date if expiry_date else (timezone.now().date() + timezone.timedelta(days=365)),
                quantity=initial_stock,
                mrp=initial_mrp,
                cost_price=initial_mrp * 0.7,
                storage_condition='NORMAL'
            )
            log_action(request.user, "CREATE_NEW_BATCH", f"Created new batch {batch_number} for {medicine.name}")

        serializer = self.get_serializer(medicine)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)

    @transaction.atomic
    def update(self, request, *args, **kwargs):
        data = request.data.copy() if hasattr(request.data, 'copy') else request.data.copy() if isinstance(request.data, dict) else dict(request.data)
        
        initial_mrp = data.pop('initial_mrp', None)
        initial_stock = data.pop('initial_stock', None)
        manufacturing_date = data.pop('manufacturing_date', None)
        expiry_date = data.pop('expiry_date', None)
        partial = kwargs.pop('partial', False)
        instance = self.get_object() # Uses filtered queryset
        
        # Validation for MRP and Stock if provided
        try:
            if initial_mrp is not None and initial_mrp != '':
                if float(initial_mrp) <= 0:
                    return Response({"error": "Price must be greater than 0"}, status=status.HTTP_400_BAD_REQUEST)
            if initial_stock is not None and initial_stock != '':
                if int(initial_stock) < 0:
                    return Response({"error": "Stock cannot be negative"}, status=status.HTTP_400_BAD_REQUEST)
        except (ValueError, TypeError):
            return Response({"error": "Invalid price or stock format"}, status=status.HTTP_400_BAD_REQUEST)

        serializer = self.get_serializer(instance, data=data, partial=partial)
        serializer.is_valid(raise_exception=True)
        medicine = serializer.save()

        # Handle Price and Stock Manual Updates (Scoped to User)
        latest_batch = medicine.batches.filter(user=request.user).order_by('-added_date').first()
        
        if latest_batch:
            if initial_mrp is not None and initial_mrp != '':
                latest_batch.mrp = float(initial_mrp)
            
            if initial_stock is not None and initial_stock != '':
                new_stock = int(initial_stock)
                current_total = sum(b.quantity for b in medicine.batches.filter(user=request.user))
                difference = new_stock - current_total
                latest_batch.quantity = max(0, latest_batch.quantity + difference)
            
            if manufacturing_date:
                latest_batch.manufacturing_date = manufacturing_date
            
            if expiry_date:
                latest_batch.expiry_date = expiry_date
                
            latest_batch.save()
            log_action(request.user, "MANUAL_INVENTORY_ADJUST", f"Manual update for {medicine.name}")
        
        return Response(serializer.data)

class BatchViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    @action(detail=False, methods=['get'])
    def near_expiry(self, request):
        days_limit = int(request.query_params.get('days', 90))
        limit_date = timezone.now().date() + timezone.timedelta(days=days_limit)
        batches = Batch.objects.filter(user=request.user, expiry_date__lte=limit_date, quantity__gt=0)
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)

class PurchaseViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Purchase.objects.all()
    serializer_class = PurchaseSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items', [])
        supplier_id = request.data.get('supplier')
        
        if not items_data:
            return Response({"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

        purchase = Purchase.objects.create(
            user=request.user,
            supplier_id=supplier_id,
            reference_no=request.data.get('reference_no', ''),
            purchase_date=request.data.get('purchase_date', timezone.now())
        )

        total_amount = 0
        for item in items_data:
            medicine_id = item.get('medicine')
            batch_number = item.get('batch_number')
            manufacturing_date = item.get('manufacturing_date')
            expiry_date = item.get('expiry_date')
            quantity = int(item.get('quantity'))
            cost_price = float(item.get('cost_price'))
            mrp = float(item.get('mrp'))

            PurchaseItem.objects.create(
                purchase=purchase,
                medicine_id=medicine_id,
                batch_number=batch_number,
                manufacturing_date=manufacturing_date,
                expiry_date=expiry_date,
                quantity=quantity,
                cost_price=cost_price,
                mrp=mrp
            )

            # Create or Update Batch (Scoped to User)
            batch, created = Batch.objects.get_or_create(
                medicine_id=medicine_id,
                batch_number=batch_number,
                user=request.user,
                defaults={
                    'user': request.user,
                    'manufacturing_date': manufacturing_date,
                    'expiry_date': expiry_date,
                    'quantity': quantity,
                    'cost_price': cost_price,
                    'mrp': mrp
                }
            )
            if not created:
                batch.quantity += quantity
                batch.cost_price = cost_price # Update to latest cost
                batch.mrp = mrp
                batch.manufacturing_date = manufacturing_date
                batch.expiry_date = expiry_date
                batch.save()
            
            total_amount += (quantity * cost_price)

        purchase.total_amount = total_amount
        purchase.save()

        log_action(request.user, "CREATE_PURCHASE", f"Purchase {purchase.id} from supplier {supplier_id}")
        
        serializer = self.get_serializer(purchase)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

class SaleViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items', [])
        customer_id = request.data.get('customer')
        
        if not items_data:
            return Response({"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

        sale = Sale.objects.create(user=request.user, customer_id=customer_id)
        total_amount = 0
        tax_amount = 0

        for item in items_data:
            medicine_id = item.get('medicine')
            requested_qty = int(item.get('quantity'))
            specified_batch_id = item.get('batch_id')
            
            # Scoped to User
            medicine = Medicine.objects.get(id=medicine_id, user=request.user)
            gst_percentage = medicine.gst_percentage

            if specified_batch_id:
                # Use specific batch
                batch = Batch.objects.get(id=specified_batch_id, medicine_id=medicine_id, user=request.user)
                if batch.quantity < requested_qty:
                    raise ValueError(f"Insufficient stock in batch {batch.batch_number} for {medicine.name}")
                
                batch.quantity -= requested_qty
                batch.save()
                
                item_total = requested_qty * batch.mrp
                item_tax = (item_total * gst_percentage) / 100
                
                SaleItem.objects.create(
                    sale=sale,
                    batch=batch,
                    quantity=requested_qty,
                    unit_price=batch.mrp,
                    tax_percentage=gst_percentage,
                    tax_amount=item_tax,
                    total_with_tax=item_total + item_tax
                )
                total_amount += item_total
                tax_amount += item_tax
            else:
                # FIFO Deduction (Scoped to User)
                batches = Batch.objects.filter(
                    user=request.user,
                    medicine_id=medicine_id, 
                    quantity__gt=0,
                    expiry_date__gt=timezone.now().date()
                ).order_by('expiry_date')

                available_qty = sum(b.quantity for b in batches)
                if available_qty < requested_qty:
                    raise ValueError(f"Insufficient stock for {medicine.name}")

                temp_qty = requested_qty
                for batch in batches:
                    if temp_qty <= 0:
                        break
                    
                    deduct = min(batch.quantity, temp_qty)
                    batch.quantity -= deduct
                    batch.save()
                    
                    # GST Calculations
                    item_total = deduct * batch.mrp
                    item_tax = (item_total * gst_percentage) / 100
                    
                    SaleItem.objects.create(
                        sale=sale,
                        batch=batch,
                        quantity=deduct,
                        unit_price=batch.mrp,
                        tax_percentage=gst_percentage,
                        tax_amount=item_tax,
                        total_with_tax=item_total + item_tax
                    )
                    
                    total_amount += item_total
                    tax_amount += item_tax
                    temp_qty -= deduct

        sale.total_amount = total_amount
        sale.tax_amount = tax_amount
        sale.grand_total = total_amount + tax_amount
        sale.save()
        
        log_action(request.user, "CREATE_SALE", f"Sale {sale.id} for customer {customer_id}")
        
        serializer = self.get_serializer(sale)
        return Response(serializer.data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    @transaction.atomic
    def return_order(self, request, pk=None):
        sale = self.get_object() # Uses filtered queryset
        if sale.status == 'RETURNED':
            return Response({"error": "Order is already returned"}, status=status.HTTP_400_BAD_REQUEST)
        if sale.status == 'CANCELLED':
            return Response({"error": "Cancelled orders cannot be returned"}, status=status.HTTP_400_BAD_REQUEST)

        # 7-Day Return Limit
        seven_days_ago = timezone.now() - timezone.timedelta(days=7)
        if sale.sale_date < seven_days_ago:
            return Response(
                {"error": "Return window expired. Orders can only be returned within 7 days."}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Revert Stock (Sales Return logic)
        for item in sale.items.all():
            batch = item.batch
            batch.quantity += item.quantity
            batch.save()
            
            # Also record in ReturnRecord for audit
            ReturnRecord.objects.create(
                user=request.user,
                batch=batch,
                return_type='SALES_RETURN',
                quantity=item.quantity,
                reason=f"Sales Return from Invoice #{sale.invoice_number}",
                status='COMPLETED'
            )

        sale.status = 'RETURNED'
        sale.save()

        log_action(request.user, "RETURN_ORDER", f"Returned Order {sale.id} (Invoice #{sale.invoice_number})")
        
        return Response({"message": "Order returned successfully and stock restored"})

class ReturnRecordViewSet(UserFilteredViewSetMixin, viewsets.ModelViewSet):
    queryset = ReturnRecord.objects.all()
    serializer_class = ReturnRecordSerializer

    @transaction.atomic
    def create(self, request, *args, **kwargs):
        batch_id = request.data.get('batch')
        quantity = int(request.data.get('quantity', 0))
        return_type = request.data.get('return_type', 'SALES_RETURN')
        
        batch = Batch.objects.get(id=batch_id, user=request.user)

        if return_type == 'PURCHASE_RETURN':
            if batch.quantity < quantity:
                return Response({"error": "Insufficient stock for purchase return"}, status=status.HTTP_400_BAD_REQUEST)
            batch.quantity -= quantity
        else: # SALES_RETURN
            batch.quantity += quantity
        
        batch.save()
        
        response = super().create(request, *args, **kwargs)
        
        log_action(
            request.user, 
            "RECORD_RETURN", 
            f"{return_type} for {batch.medicine.name} ({quantity} units)"
        )
        
        return response

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    def get_queryset(self):
        return AuditLog.objects.filter(user=self.request.user).order_by('-timestamp')
    serializer_class = AuditLogSerializer

class AnalyticsViewSet(viewsets.ViewSet):
    def list(self, request):
        # KPI Analytics (Scoped to User)
        total_medicines = Medicine.objects.filter(user=request.user).count()
        total_stock = Batch.objects.filter(user=request.user).aggregate(total=Sum('quantity'))['total'] or 0
        total_sales = Sale.objects.filter(user=request.user, status='COMPLETED').aggregate(total=Sum('grand_total'))['total'] or 0
        
        # Near Expiry Counts (Scoped to User)
        today = timezone.now().date()
        critical = Batch.objects.filter(user=request.user, expiry_date__lte=today + timezone.timedelta(days=30), quantity__gt=0).count()
        warning = Batch.objects.filter(user=request.user, expiry_date__gt=today + timezone.timedelta(days=30), 
                                      expiry_date__lte=today + timezone.timedelta(days=90), 
                                      quantity__gt=0).count()

        return Response({
            'kpis': {
                'total_medicines': total_medicines,
                'total_stock': total_stock,
                'total_sales': total_sales,
            },
            'expiry_alerts': {
                'critical': critical,
                'warning': warning,
            }
        })

    @action(detail=False, methods=['get'])
    def sales_trends(self, request):
        last_7_days = []
        for i in range(7):
            date = timezone.now().date() - timezone.timedelta(days=i)
            amount = Sale.objects.filter(
                user=request.user,
                sale_date__date=date, 
                status='COMPLETED'
            ).aggregate(total=Sum('grand_total'))['total'] or 0
            last_7_days.append({
                'date': date.strftime('%Y-%m-%d'),
                'amount': float(amount)
            })
        return Response(last_7_days[::-1])

    @action(detail=False, methods=['get'])
    def reports(self, request):
        today = timezone.now()
        last_60_days = today - timezone.timedelta(days=60)
        
        fast_moving = SaleItem.objects.filter(sale__user=request.user, sale__status='COMPLETED')\
            .values('batch__medicine__name')\
            .annotate(total_sold=Sum('quantity'), revenue=Sum('total_with_tax'))\
            .order_by('-total_sold')[:10]
            
        sold_recently = SaleItem.objects.filter(sale__user=request.user, sale__sale_date__gte=last_60_days, sale__status='COMPLETED')\
            .values_list('batch__medicine_id', flat=True).distinct()
        
        dead_stock = Medicine.objects.filter(user=request.user, batches__quantity__gt=0)\
            .exclude(id__in=sold_recently)\
            .annotate(total_qty=Sum('batches__quantity'))\
            .values('name', 'total_qty', 'manufacturer')[:10]
            
        # Category distribution (Scoped to User)
        category_dist = Medicine.objects.filter(user=request.user).values('category')\
            .annotate(count=Count('id'))\
            .order_by('-count')

        return Response({
            'fast_moving': fast_moving,
            'dead_stock': dead_stock,
            'category_distribution': category_dist
        })

    @action(detail=False, methods=['get'])
    def download_detailed_report(self, request):
        import csv
        from django.http import HttpResponse
        
        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="pharmacy_detailed_report.csv"'
        
        writer = csv.writer(response)
        
        # 1. Fast Moving Items
        writer.writerow(['TOP 10 FAST MOVING ITEMS'])
        writer.writerow(['Medicine Name', 'Total Units Sold', 'Total Revenue'])
        fast_moving = SaleItem.objects.filter(sale__user=request.user, sale__status='COMPLETED')\
            .values('batch__medicine__name')\
            .annotate(total_sold=Sum('quantity'), revenue=Sum('total_with_tax'))\
            .order_by('-total_sold')[:10]
        for item in fast_moving:
            writer.writerow([item['batch__medicine__name'], item['total_sold'], item['revenue']])
        
        writer.writerow([]) # Spacer
        
        # 2. Dead Stock
        writer.writerow(['DEAD STOCK ALERT (Last 60 Days)'])
        writer.writerow(['Medicine Name', 'Manufacturer', 'Quantity in Stock'])
        today = timezone.now()
        last_60_days = today - timezone.timedelta(days=60)
        sold_recently = SaleItem.objects.filter(sale__user=request.user, sale__sale_date__gte=last_60_days, sale__status='COMPLETED')\
            .values_list('batch__medicine_id', flat=True).distinct()
        dead_stock = Medicine.objects.filter(user=request.user, batches__quantity__gt=0)\
            .exclude(id__in=sold_recently)\
            .annotate(total_qty=Sum('batches__quantity'))\
            .values('name', 'total_qty', 'manufacturer')[:20]
        for item in dead_stock:
            writer.writerow([item['name'], item['manufacturer'], item['total_qty']])
            
        writer.writerow([]) # Spacer
        
        # 3. Category Distribution
        writer.writerow(['STOCK DISTRIBUTION BY CATEGORY'])
        writer.writerow(['Category', 'Medicine Count'])
        category_dist = Medicine.objects.filter(user=request.user).values('category')\
            .annotate(count=Count('id'))\
            .order_by('-count')
        for item in category_dist:
            writer.writerow([item['category'] or 'Uncategorized', item['count']])
            
        return response
