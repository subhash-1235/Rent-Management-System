from django.urls import path, include
from rest_framework.routers import DefaultRouter
from rest_framework_simplejwt.views import TokenObtainPairView, TokenRefreshView
from .views import (
    RoomViewSet, MonthlyBillViewSet, RoomMeterReadingViewSet,
    PaymentHistoryViewSet, QRCodeSettingsViewSet, DashboardViewSet,
    TenantHistoryViewSet, RegisterView,
    # OTP Views
    send_otp, verify_otp, resend_otp, check_email,
    # 🔥 NEW: Tenant Views
    tenant_check_mobile, tenant_register, tenant_login,
    tenant_profile, tenant_change_password, tenant_bills, tenant_pay_bill
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
    
    # ========================================
    # OTP URLs
    # ========================================
    path('check-email/', check_email, name='check-email'),
    path('send-otp/', send_otp, name='send-otp'),
    path('verify-otp/', verify_otp, name='verify-otp'),
    path('resend-otp/', resend_otp, name='resend-otp'),
    
    # ========================================
    # 🔥 NEW: Tenant URLs
    # ========================================
    path('tenant/check-mobile/', tenant_check_mobile, name='tenant-check-mobile'),
    path('tenant/register/', tenant_register, name='tenant-register'),
    path('tenant/login/', tenant_login, name='tenant-login'),
    path('tenant/profile/', tenant_profile, name='tenant-profile'),
    path('tenant/change-password/', tenant_change_password, name='tenant-change-password'),
    path('tenant/bills/', tenant_bills, name='tenant-bills'),
    path('tenant/pay-bill/', tenant_pay_bill, name='tenant-pay-bill'),
]