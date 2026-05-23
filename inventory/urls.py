from django.urls import path
from . import views

urlpatterns = [
    path('', views.dashboard, name='dashboard'),
    path('medicines/', views.medicine_list, name='medicine_list'),
    path('medicines/add/', views.add_medicine, name='add_medicine'),
    path('medicines/<int:pk>/', views.medicine_detail, name='medicine_detail'),
    path('batches/add/', views.add_batch, name='add_batch'),
    path('sale/', views.create_sale, name='create_sale'),
    path('expiry/', views.expiry_report, name='expiry_report'),
    path('returns/', views.return_management, name='return_management'),
    path('analytics/', views.analytics, name='analytics'),
]
