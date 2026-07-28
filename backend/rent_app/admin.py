from django.contrib import admin
from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings
)

@admin.register(Room)
class RoomAdmin(admin.ModelAdmin):
    list_display = ['room_number', 'tenant_name', 'tenant_mobile', 'room_rent', 'is_active']
    search_fields = ['tenant_name', 'room_number']
    list_filter = ['is_active']


@admin.register(MonthlyBill)
class MonthlyBillAdmin(admin.ModelAdmin):
    list_display = ['month', 'per_unit_rate', 'total_units', 'total_bill_amount', 'is_closed']
    list_filter = ['is_closed']
    ordering = ['-month']


@admin.register(RoomMeterReading)
class RoomMeterReadingAdmin(admin.ModelAdmin):
    list_display = ['room', 'monthly_bill', 'units_consumed', 'total_amount', 'is_paid']
    list_filter = ['is_paid', 'monthly_bill']
    search_fields = ['room__tenant_name']


@admin.register(PaymentHistory)
class PaymentHistoryAdmin(admin.ModelAdmin):
    list_display = ['room_reading', 'amount', 'payment_mode', 'payment_date']
    list_filter = ['payment_mode']
    search_fields = ['room_reading__room__tenant_name']


@admin.register(QRCodeSettings)
class QRCodeSettingsAdmin(admin.ModelAdmin):
    list_display = ['upi_id', 'is_active', 'updated_at']