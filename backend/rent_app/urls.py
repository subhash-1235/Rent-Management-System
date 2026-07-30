from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RoomViewSet, MonthlyBillViewSet, RoomMeterReadingViewSet,
    PaymentHistoryViewSet, QRCodeSettingsViewSet, DashboardViewSet,
    TenantHistoryViewSet, RegisterView
)

router = DefaultRouter()
router.register(r'rooms', RoomViewSet, basename='room')
router.register(r'bills', MonthlyBillViewSet, basename='bill')
router.register(r'readings', RoomMeterReadingViewSet, basename='reading')
router.register(r'payments', PaymentHistoryViewSet, basename='payment')
router.register(r'qr-settings', QRCodeSettingsViewSet, basename='qr-setting')
router.register(r'tenant-history', TenantHistoryViewSet, basename='tenant-history')

urlpatterns = [
    path('', include(router.urls)),
    path('dashboard/stats/', DashboardViewSet.as_view({'get': 'stats'}), name='dashboard-stats'),
    
    # Auth URLs
    path('token/', TokenObtainPairView.as_view(), name='token_obtain_pair'),
    path('token/refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    path('register/', RegisterView.as_view(), name='register'),
]