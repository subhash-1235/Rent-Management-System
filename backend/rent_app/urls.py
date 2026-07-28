from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import (
    RoomViewSet, MonthlyBillViewSet, RoomMeterReadingViewSet,
    PaymentHistoryViewSet, QRCodeSettingsViewSet, DashboardViewSet
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet)
router.register(r'bills', MonthlyBillViewSet)
router.register(r'readings', RoomMeterReadingViewSet)
router.register(r'payments', PaymentHistoryViewSet)
router.register(r'qr-settings', QRCodeSettingsViewSet)
router.register(r'dashboard', DashboardViewSet, basename='dashboard')

urlpatterns = [
    path('', include(router.urls)),
]