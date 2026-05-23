from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db.models import Sum, Count, F
from django.utils import timezone
from .models import Medicine, Batch, Sale, SaleItem, ReturnRecord
from .serializers import (
    MedicineSerializer, BatchSerializer, SaleSerializer, 
    SaleItemSerializer, ReturnRecordSerializer
)

class MedicineViewSet(viewsets.ModelViewSet):
    queryset = Medicine.objects.all()
    serializer_class = MedicineSerializer

class BatchViewSet(viewsets.ModelViewSet):
    queryset = Batch.objects.all()
    serializer_class = BatchSerializer

    @action(detail=False, methods=['get'])
    def near_expiry(self, request):
        days_limit = int(request.query_params.get('days', 90))
        limit_date = timezone.now().date() + timezone.timedelta(days=days_limit)
        batches = Batch.objects.filter(expiry_date__lte=limit_date, quantity__gt=0)
        serializer = self.get_serializer(batches, many=True)
        return Response(serializer.data)

from django.db import transaction

class SaleViewSet(viewsets.ModelViewSet):
    queryset = Sale.objects.all()
    serializer_class = SaleSerializer

    def create(self, request, *args, **kwargs):
        items_data = request.data.get('items', [])
        customer_info = request.data.get('customer_info', '')
        
        if not items_data:
            return Response({"error": "No items provided"}, status=status.HTTP_400_BAD_REQUEST)

        try:
            with transaction.atomic():
                sale = Sale.objects.create(customer_info=customer_info)
                total_amount = 0

                for item in items_data:
                    medicine_id = item.get('medicine')
                    requested_qty = int(item.get('quantity'))
                    
                    # FIFO Deduction
                    batches = Batch.objects.filter(
                        medicine_id=medicine_id, 
                        quantity__gt=0,
                        expiry_date__gt=timezone.now().date()
                    ).order_by('expiry_date')

                    available_qty = sum(b.quantity for b in batches)
                    if available_qty < requested_qty:
                        raise ValueError(f"Insufficient stock for medicine ID {medicine_id}")

                    temp_qty = requested_qty
                    for batch in batches:
                        if temp_qty <= 0:
                            break
                        
                        deduct = min(batch.quantity, temp_qty)
                        batch.quantity -= deduct
                        batch.save()
                        
                        SaleItem.objects.create(
                            sale=sale,
                            batch=batch,
                            quantity=deduct,
                            unit_price=batch.mrp
                        )
                        
                        total_amount += (deduct * batch.mrp)
                        temp_qty -= deduct

                sale.total_amount = total_amount
                sale.save()
                
                serializer = self.get_serializer(sale)
                return Response(serializer.data, status=status.HTTP_201_CREATED)

        except ValueError as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({"error": "An unexpected error occurred during sale processing"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

class ReturnRecordViewSet(viewsets.ModelViewSet):
    queryset = ReturnRecord.objects.all()
    serializer_class = ReturnRecordSerializer

class AnalyticsViewSet(viewsets.ViewSet):
    def list(self, request):
        # KPI Analytics
        total_medicines = Medicine.objects.count()
        total_stock = Batch.objects.aggregate(total=Sum('quantity'))['total'] or 0
        total_sales = Sale.objects.aggregate(total=Sum('total_amount'))['total'] or 0
        
        # Near Expiry Counts
        today = timezone.now().date()
        critical = Batch.objects.filter(expiry_date__lte=today + timezone.timedelta(days=30), quantity__gt=0).count()
        warning = Batch.objects.filter(expiry_date__gt=today + timezone.timedelta(days=30), 
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
        # Example: Last 7 days sales
        last_7_days = []
        for i in range(7):
            date = timezone.now().date() - timezone.timedelta(days=i)
            amount = Sale.objects.filter(sale_date__date=date).aggregate(total=Sum('total_amount'))['total'] or 0
            last_7_days.append({
                'date': date.strftime('%Y-%m-%d'),
                'amount': float(amount)
            })
        return Response(last_7_days[::-1])
