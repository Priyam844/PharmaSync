from rest_framework import serializers
from .models import Medicine, Batch, Sale, SaleItem, ReturnRecord

class BatchSerializer(serializers.ModelSerializer):
    days_to_expiry = serializers.ReadOnlyField()
    expiry_status = serializers.ReadOnlyField()
    is_return_eligible = serializers.ReadOnlyField()

    class Meta:
        model = Batch
        fields = '__all__'

class MedicineSerializer(serializers.ModelSerializer):
    batches = BatchSerializer(many=True, read_only=True)

    class Meta:
        model = Medicine
        fields = '__all__'

class SaleItemSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='batch.medicine.name')

    class Meta:
        model = SaleItem
        fields = '__all__'

class SaleSerializer(serializers.ModelSerializer):
    items = SaleItemSerializer(many=True, read_only=True)

    class Meta:
        model = Sale
        fields = '__all__'

class ReturnRecordSerializer(serializers.ModelSerializer):
    medicine_name = serializers.ReadOnlyField(source='batch.medicine.name')
    batch_number = serializers.ReadOnlyField(source='batch.batch_number')

    class Meta:
        model = ReturnRecord
        fields = '__all__'
