import os
import django
from datetime import date, timedelta

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'pharmacy_system.settings')
django.setup()

from inventory.models import Medicine, Batch

def seed_data():
    # Create Medicines
    paracetamol = Medicine.objects.create(name="Paracetamol 500mg", generic_name="Acetaminophen", category="Tablet", manufacturer="GSK")
    amoxicillin = Medicine.objects.create(name="Amoxicillin 250mg", generic_name="Amoxicillin", category="Capsule", manufacturer="Abbott")
    cetirizine = Medicine.objects.create(name="Cetirizine 10mg", generic_name="Cetirizine", category="Tablet", manufacturer="Cipla")

    # Create Batches
    # Critical Expiry (within 30 days)
    Batch.objects.create(
        medicine=paracetamol,
        batch_number="PARA-001",
        expiry_date=date.today() + timedelta(days=15),
        quantity=50,
        mrp=40.00,
        cost_price=25.00
    )

    # Warning Expiry (within 90 days)
    Batch.objects.create(
        medicine=amoxicillin,
        batch_number="AMOX-001",
        expiry_date=date.today() + timedelta(days=60),
        quantity=100,
        mrp=120.00,
        cost_price=80.00
    )

    # Safe Expiry
    Batch.objects.create(
        medicine=cetirizine,
        batch_number="CETI-001",
        expiry_date=date.today() + timedelta(days=365),
        quantity=200,
        mrp=30.00,
        cost_price=15.00
    )

    # Another batch for FIFO test
    Batch.objects.create(
        medicine=paracetamol,
        batch_number="PARA-002",
        expiry_date=date.today() + timedelta(days=400),
        quantity=100,
        mrp=42.00,
        cost_price=26.00
    )

    print("Sample data seeded successfully!")

if __name__ == "__main__":
    seed_data()
