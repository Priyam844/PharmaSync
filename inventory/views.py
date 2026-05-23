from django.shortcuts import render, redirect, get_object_or_404
from django.db.models import Sum, Count, F, Q
from django.utils import timezone
from datetime import timedelta
from .models import Medicine, Batch, Sale, SaleItem, ReturnRecord
from django.contrib import messages
from django.db import transaction

def dashboard(request):
    today = timezone.now().date()
    
    # Expiry Alerts
    critical_expiry = Batch.objects.filter(expiry_date__lte=today + timedelta(days=30), quantity__gt=0)
    warning_expiry = Batch.objects.filter(expiry_date__gt=today + timedelta(days=30), 
                                          expiry_date__lte=today + timedelta(days=90), 
                                          quantity__gt=0)
    
    # Stock Summary
    total_medicines = Medicine.objects.count()
    total_stock_value = Batch.objects.aggregate(total=Sum(F('quantity') * F('mrp')))['total'] or 0
    
    # Sales Summary (Last 30 days)
    last_30_days = timezone.now() - timedelta(days=30)
    recent_sales_total = Sale.objects.filter(sale_date__gte=last_30_days).aggregate(total=Sum('total_amount'))['total'] or 0
    
    # Fast Moving Items (Simple count of sale items in last 30 days)
    fast_moving = SaleItem.objects.filter(sale__sale_date__gte=last_30_days)\
        .values('batch__medicine__name')\
        .annotate(total_sold=Sum('quantity'))\
        .order_by('-total_sold')[:5]

    context = {
        'critical_count': critical_expiry.count(),
        'warning_count': warning_expiry.count(),
        'total_medicines': total_medicines,
        'total_stock_value': total_stock_value,
        'recent_sales_total': recent_sales_total,
        'critical_batches': critical_expiry[:5],
        'fast_moving': fast_moving,
    }
    return render(request, 'inventory/dashboard.html', context)

def medicine_list(request):
    medicines = Medicine.objects.annotate(total_qty=Sum('batches__quantity'))
    return render(request, 'inventory/medicine_list.html', {'medicines': medicines})

def medicine_detail(request, pk):
    medicine = get_object_or_404(Medicine, pk=pk)
    batches = medicine.batches.all().order_by('expiry_date')
    return render(request, 'inventory/medicine_detail.html', {'medicine': medicine, 'batches': batches})

@transaction.atomic
def create_sale(request):
    if request.method == 'POST':
        medicine_id = request.POST.get('medicine_id')
        quantity_requested = int(request.POST.get('quantity', 0))
        
        medicine = get_object_or_404(Medicine, id=medicine_id)
        
        # FIFO Logic: Pick oldest batches first
        batches = Batch.objects.filter(medicine=medicine, quantity__gt=0, expiry_date__gt=timezone.now().date()).order_by('expiry_date')
        
        total_available = batches.aggregate(total=Sum('quantity'))['total'] or 0
        
        if quantity_requested > total_available:
            messages.error(request, f"Not enough stock for {medicine.name}. Available: {total_available}")
            return redirect('create_sale')
        
        sale = Sale.objects.create(total_amount=0)
        remaining_to_deduct = quantity_requested
        total_sale_amount = 0
        
        for batch in batches:
            if remaining_to_deduct <= 0:
                break
                
            deduct_qty = min(batch.quantity, remaining_to_deduct)
            batch.quantity -= deduct_qty
            batch.save()
            
            SaleItem.objects.create(
                sale=sale,
                batch=batch,
                quantity=deduct_qty,
                unit_price=batch.mrp
            )
            
            total_sale_amount += (deduct_qty * batch.mrp)
            remaining_to_deduct -= deduct_qty
            
        sale.total_amount = total_sale_amount
        sale.save()
        
        messages.success(request, f"Sale completed! Total: ₹{total_sale_amount}")
        return redirect('dashboard')
        
    medicines = Medicine.objects.filter(batches__quantity__gt=0).distinct()
    return render(request, 'inventory/create_sale.html', {'medicines': medicines})

def expiry_report(request):
    batches = Batch.objects.filter(quantity__gt=0).order_by('expiry_date')
    return render(request, 'inventory/expiry_report.html', {'batches': batches})

def return_management(request):
    today = timezone.now().date()
    eligible_batches = Batch.objects.filter(
        expiry_date__gte=today + timedelta(days=90),
        expiry_date__lte=today + timedelta(days=180),
        quantity__gt=0
    )
    existing_returns = ReturnRecord.objects.all().order_by('-return_date')
    return render(request, 'inventory/return_management.html', {
        'eligible_batches': eligible_batches,
        'existing_returns': existing_returns
    })

def analytics(request):
    today = timezone.now()
    last_60_days = today - timedelta(days=60)
    
    fast_moving = SaleItem.objects.values('batch__medicine__name')\
        .annotate(total_sold=Sum('quantity'))\
        .order_by('-total_sold')[:10]
        
    sold_recently = SaleItem.objects.filter(sale__sale_date__gte=last_60_days)\
        .values_list('batch__medicine_id', flat=True).distinct()
    
    dead_stock = Medicine.objects.filter(batches__quantity__gt=0)\
        .exclude(id__in=sold_recently)\
        .annotate(total_qty=Sum('batches__quantity'))\
        .distinct()
        
    return render(request, 'inventory/analytics.html', {
        'fast_moving': fast_moving,
        'dead_stock': dead_stock
    })

def add_medicine(request):
    if request.method == 'POST':
        Medicine.objects.create(
            name=request.POST.get('name'),
            generic_name=request.POST.get('generic_name'),
            manufacturer=request.POST.get('manufacturer'),
            category=request.POST.get('category'),
            description=request.POST.get('description')
        )
        messages.success(request, "Medicine added successfully!")
        return redirect('medicine_list')
    return render(request, 'inventory/add_medicine.html')

def add_batch(request):
    if request.method == 'POST':
        medicine = get_object_or_404(Medicine, id=request.POST.get('medicine_id'))
        Batch.objects.create(
            medicine=medicine,
            batch_number=request.POST.get('batch_number'),
            expiry_date=request.POST.get('expiry_date'),
            quantity=request.POST.get('quantity'),
            mrp=request.POST.get('mrp'),
            cost_price=request.POST.get('cost_price'),
            storage_condition=request.POST.get('storage_condition')
        )
        messages.success(request, f"Batch added for {medicine.name}!")
        return redirect('medicine_detail', pk=medicine.id)
    medicines = Medicine.objects.all()
    return render(request, 'inventory/add_batch.html', {'medicines': medicines})
