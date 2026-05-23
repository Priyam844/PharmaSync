from django.db import models
from django.utils import timezone
from datetime import timedelta

class Medicine(models.Model):
    name = models.CharField(max_length=200)
    generic_name = models.CharField(max_length=200, blank=True, null=True)
    manufacturer = models.CharField(max_length=200, blank=True, null=True)
    category = models.CharField(max_length=100, blank=True, null=True)
    description = models.TextField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.name

class Batch(models.Model):
    STORAGE_CHOICES = [
        ('NORMAL', 'Normal'),
        ('REFRIGERATED', 'Refrigerated'),
    ]

    medicine = models.ForeignKey(Medicine, on_delete=models.CASCADE, related_name='batches')
    batch_number = models.CharField(max_length=100)
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

class Sale(models.Model):
    sale_date = models.DateTimeField(auto_now_add=True)
    total_amount = models.DecimalField(max_digits=12, decimal_places=2, default=0)
    customer_info = models.CharField(max_length=200, blank=True, null=True)

    def __str__(self):
        return f"Sale {self.id} on {self.sale_date.strftime('%Y-%m-%d %H:%M')}"

class SaleItem(models.Model):
    sale = models.ForeignKey(Sale, on_delete=models.CASCADE, related_name='items')
    batch = models.ForeignKey(Batch, on_delete=models.PROTECT)
    quantity = models.PositiveIntegerField()
    unit_price = models.DecimalField(max_digits=10, decimal_places=2)

    def __str__(self):
        return f"{self.batch.medicine.name} x {self.quantity}"

class ReturnRecord(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('COMPLETED', 'Completed'),
    ]
    batch = models.ForeignKey(Batch, on_delete=models.CASCADE)
    quantity = models.PositiveIntegerField()
    reason = models.TextField()
    return_date = models.DateField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')

    def __str__(self):
        return f"Return: {self.batch.medicine.name} ({self.batch.batch_number})"
