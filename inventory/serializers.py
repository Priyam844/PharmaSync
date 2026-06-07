from rest_framework import serializers
from .models import (
    Medicine, Batch, Sale, SaleItem, ReturnRecord, 
    Supplier, Customer, Purchase, PurchaseItem, AuditLog
)

class SupplierSerializer(serializers.ModelSerializer):
    class Meta:
        model = Supplier
        fields = '__all__'
        read_only_fields = ['user']

class CustomerSerializer(serializers.ModelSerializer):
    class Meta:
        model = Customer
        fields = '__all__'
        read_only_fields = ['user']

class BatchSerializer(serializers.ModelSerializer):
    days_to_expiry = serializers.ReadOnlyField()
    expiry_status = serializers.ReadOnlyField()
    is_return_eligible = serializers.ReadOnlyField()
    medicine_name = serializers.ReadOnlyField(source='medicine.name')

    class Meta:
        model = Batch
        fields = '__all__'
        read_only_fields = ['user']
...
class MedicineSerializer(serializers.ModelSerializer):
    batches = BatchSerializer(many=True, read_only=True)
    total_stock = serializers.SerializerMethodField()
    latest_mrp = serializers.SerializerMethodField()

    class Meta:
        model = Medicine
        fields = [
            'id', 'name', 'generic_name', 'manufacturer', 'category', 
            'description', 'gst_percentage', 'created_at', 'batches',
            'total_stock', 'latest_mrp'
        ]
        read_only_fields = ['user']

    def get_total_stock(self, obj):
        return sum(b.quantity for b in obj.batches.all())

    def get_latest_mrp(self, obj):
        latest = obj.batches.order_by('-added_date').first()
        return latest.mrp if latest else 0

class PurchaseItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='medicine.name')

    class Meta:
        model = PurchaseItem
        fields = '__all__'

class PurchaseSerializer(serializers.ModelSerializer):
    items = PurchaseItemSerializer(many=True, read_only=True)
    supplier_name = serializers.ReadOnlyField(source='supplier.name')

    class Meta:
        model = Purchase
        fields = '__all__'
        read_only_fields = ['user']

class SaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='batch.medicine.name')

    class Meta:
        model = SaleItem
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)
    customer_name = serializers.ReadOnlyField(source='customer.name')
    customer_phone = serializers.ReadOnlyField(source='customer.phone')

    class Meta:
        model = Sale
        fields = '__all__'
        read_only_fields = ['user']

class ReturnRecordSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='batch.medicine.name')
    batch_number = serializers.ReadOnlyField(source='batch.batch_number')

    class Meta:
        model = ReturnRecord
        fields = '__all__'
        read_only_fields = ['user']

class AuditLogSerializer(serializers.ModelSerializer):
    username = serializers.ReadOnlyField(source='user.username')

    class Meta:
        model = AuditLog
        fields = '__all__'
