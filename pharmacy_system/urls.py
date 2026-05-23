from django.contrib import admin
from django.urls import path, include
from rest_framework.routers import DefaultRouter
from inventory.api_views import (
    MedicineViewSet, BatchViewSet, SaleViewSet, 
    ReturnRecordViewSet, AnalyticsViewSet
)

router = DefaultRouter()
router.register(r'medicines', MedicineViewSet)
router.register(r'batches', BatchViewSet)
router.register(r'sales', SaleViewSet)
router.register(r'returns', ReturnRecordViewSet)
router.register(r'analytics', AnalyticsViewSet, basename='analytics')

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/auth/', include('dj_rest_auth.urls')),
    path('api/auth/registration/', include('dj_rest_auth.registration.urls')),
    path('api/', include(router.urls)),
    path('', include('inventory.urls')),
]
