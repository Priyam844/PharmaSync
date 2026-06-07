from django.db import models
from django.utils import timezone
from django.contrib.auth.models import User
from datetime import timedelta

class Supplier(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='suppliers', null=True)
    name = models.CharField(max_length=200)
    contact_person = models.CharField(max_length=200, blank=True, null=True)
    phone = models.CharField(max_length=20, blank=True, null=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    gstin = models.CharField(max_length=15, blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Customer(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='customers', null=True)
    name = models.CharField(max_length=200)
    phone = models.CharField(max_length=20, unique=True)
    email = models.EmailField(blank=True, null=True)
    address = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.name} ({self.phone})"

class Medicine(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='medicines', null=True)
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True, null=True)
    manufacturer = models.CharField(max_length=200, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    gst_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=12.0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Batch(models.Model):
    STORAGE_CHOICES = [
        ('NORMAL', 'Normal'),
        ('REFRIGERATED', 'Refrigerated'),
    ]

    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='batches', null=True)
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField()
    mrp = models.DecimalField(max_digits=10, decimal_places=2)
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    storage_condition = models.CharField(max_length=20, choices=STORAGE_CHOICES, default='NORMAL')
    added_date = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.medicine.name} - {self.batch_number} (Exp: {self.expiry_date})"

    @property
    def days_to_expiry(self):
        return (self.expiry_date - timezone.now().date()).days

    @property
    def expiry_status(self):
        days = self.days_to_expiry
        if days <= 0:
            return "Expired"
        elif days <= 30:
            return "Critical"
        elif days <= 90:
            return "Warning"
        else:
            return "Safe"

    @property
    def is_return_eligible(self):
        days = self.days_to_expiry
        return 90 <= days <= 180

    class Meta:
        verbose_name_plural = "Batches"
        ordering = ['expiry_date']

class Purchase(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='purchases', null=True)
    supplier = models.ForeignKey(Supplier, on_delete=models.CASCADE, related_name='purchases')
    purchase_date = models.DateTimeField(default=timezone.now)
    reference_no = models.CharField(max_length=100, blank=True, null=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"Purchase {self.id} from {self.supplier.name}"

class PurchaseItem(models.Model):
    purchase = models.ForeignKey(Purchase, on_delete=models.CASCADE, related_name='items')
    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE)
    batch_number = models.CharField(max_length=100)
    manufacturing_date = models.DateField(blank=True, null=True)
    expiry_date = models.DateField()
    quantity = models.PositiveIntegerField()
    cost_price = models.DecimalField(max_digits=10, decimal_places=2)
    mrp = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.medicine.name} - {self.batch_number}"

class Sale(models.Model):
    STATUS_CHOICES = [
        ('COMPLETED', 'Completed'),
        ('CANCELLED', 'Cancelled'),
        ('RETURNED', 'Returned'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='sales', null=True)
    invoice_number = models.CharField(max_length=20, unique=True, blank=True, null=True)
    customer = models.ForeignKey(Customer, on_delete=models.SET_NULL, null=True, blank=True, related_name='sales')
    sale_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    grand_total = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')
    prescription_image = models.ImageField(upload_to='prescriptions/', blank=True, null=True)
    customer_info = models.CharField(max_length=200, blank=True, null=True) # Kept for backward compatibility

    def save(self, *args, **kwargs):
        if not self.invoice_number:
            year = timezone.now().year
            last_sale = Sale.objects.filter(invoice_number__startswith=f"INV-{year}").order_by('-id').first()
            if last_sale and last_sale.invoice_number:
                last_num = int(last_sale.invoice_number.split('-')[-1])
                new_num = str(last_num + 1).zfill(5)
            else:
                new_num = "00001"
            self.invoice_number = f"INV-{year}-{new_num}"
        super().save(*args, **kwargs)

    def __str__(self):
        return f"Invoice {self.invoice_number} on {self.sale_date.strftime('%Y-%m-%d %H:%M')}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)
    tax_percentage = models.DecimalField(max_digits=5, decimal_places=2, default=0)
    tax_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_with_tax = models.DecimalField(max_digits=10, decimal_places=2, default=0)

    def __str__(self):
        return f"{self.batch.medicine.name} x {self.quantity}"

class ReturnRecord(models.Model):
    RETURN_TYPES = [
        ('SALES_RETURN', 'Sales Return (Customer to Pharmacy)'),
        ('PURCHASE_RETURN', 'Purchase Return (Pharmacy to Supplier)'),
    ]
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
    ]
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='returns', null=True)
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    return_type = models.CharField(max_length=20, choices=RETURN_TYPES, default='SALES_RETURN')
    quantity = models.PositiveIntegerField()
    reason = models.TextField()
    return_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='COMPLETED')

    def __str__(self):
        return f"{self.get_return_type_display()}: {self.batch.medicine.name} ({self.quantity})"

class AuditLog(models.Model):
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True)
    action = models.CharField(max_length=255)
    details = models.TextField(blank=True, null=True)
    timestamp = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user} - {self.action} at {self.timestamp}"
