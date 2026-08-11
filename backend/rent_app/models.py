from django.db import models
from django.contrib.auth.models import User
from django.core.validators import MinValueValidator, MaxValueValidator, DecimalValidator
from decimal import Decimal
from django.utils import timezone
from datetime import timedelta

class Room(models.Model):
    """Room Model - Each room has a tenant and fixed rent"""
    room_number = models.IntegerField(validators=[MinValueValidator(1)])
    tenant_name = models.CharField(max_length=100, blank=True, null=True)
    tenant_mobile = models.CharField(max_length=15, blank=True, null=True)
    tenant_email = models.CharField(max_length=100, blank=True, null=True)
    room_rent = models.DecimalField(max_digits=10, decimal_places=2, validators=[MinValueValidator(0)])
    move_in_date = models.DateField(null=True, blank=True)
    advance_payment = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    address = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    is_deleted = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    # 🔥 NEW: Aadhar Card Fields (store base64 images in database)
    aadhar_front = models.TextField(blank=True, null=True)
    aadhar_back = models.TextField(blank=True, null=True)

    def __str__(self):
        return f"Room {self.room_number} - {self.tenant_name or 'Vacant'}"

    class Meta:
        ordering = ['room_number']



class MonthlyBill(models.Model):
    """Monthly Bill - Per unit rate and month"""
    month = models.DateField()
    per_unit_rate = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    total_bill_amount = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)],
        default=0
    )
    total_units = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        default=0,
        validators=[MinValueValidator(0)]
    )
    is_closed = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.month.strftime('%B %Y')} - ₹{self.per_unit_rate}/unit"

    class Meta:
        ordering = ['-month']
        unique_together = ['month']


class RoomMeterReading(models.Model):
    """Each room's meter reading for a specific month"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='readings')
    monthly_bill = models.ForeignKey(MonthlyBill, on_delete=models.CASCADE, related_name='readings')
    units_consumed = models.DecimalField(
        max_digits=10, 
        decimal_places=2, 
        validators=[MinValueValidator(0)]
    )
    electricity_charge = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    paid_amount = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    is_paid = models.BooleanField(default=False)
    paid_date = models.DateTimeField(null=True, blank=True)
    payment_mode = models.CharField(max_length=20, blank=True, null=True, choices=[
        ('CASH', 'Cash'),
        ('UPI', 'UPI'),
        ('QR', 'QR Code'),
        ('BANK', 'Bank Transfer'),
    ])
    tenant_name_snapshot = models.CharField(max_length=100, blank=True, null=True)
    tenant_mobile_snapshot = models.CharField(max_length=15, blank=True, null=True)
    room_rent_snapshot = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tenant_name_snapshot or 'Room ' + str(self.room.room_number)} - {self.monthly_bill.month.strftime('%B %Y')}"

    class Meta:
        ordering = ['room__room_number']
        unique_together = ['room', 'monthly_bill']


class PaymentHistory(models.Model):
    """Track all payment transactions"""
    room_reading = models.ForeignKey(RoomMeterReading, on_delete=models.CASCADE, related_name='payments')
    amount = models.DecimalField(max_digits=10, decimal_places=2)
    payment_date = models.DateTimeField(auto_now_add=True)
    payment_mode = models.CharField(max_length=20, choices=[
        ('CASH', 'Cash'),
        ('UPI', 'UPI'),
        ('QR', 'QR Code'),
        ('BANK', 'Bank Transfer'),
    ])
    transaction_id = models.CharField(max_length=100, blank=True, null=True)
    remarks = models.TextField(blank=True, null=True)
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    is_partial = models.BooleanField(default=False)

    def __str__(self):
        return f"{self.room_reading.tenant_name_snapshot or 'Room ' + str(self.room_reading.room.room_number)} - ₹{self.amount}"

    class Meta:
        ordering = ['-payment_date']


class TenantHistory(models.Model):
    """Store complete tenant history - permanent record"""
    room = models.ForeignKey(Room, on_delete=models.CASCADE, related_name='tenant_histories')
    tenant_name = models.CharField(max_length=100)
    tenant_mobile = models.CharField(max_length=15, blank=True, null=True)
    tenant_email = models.CharField(max_length=100, blank=True, null=True)
    room_rent = models.DecimalField(max_digits=10, decimal_places=2)
    address = models.TextField(blank=True, null=True)
    move_in_date = models.DateField(null=True, blank=True)
    move_out_date = models.DateField(null=True, blank=True)
    aadhar_data = models.JSONField(default=dict, blank=True)
    total_paid = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    total_bills = models.DecimalField(max_digits=10, decimal_places=2, default=0)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.tenant_name} - Room {self.room.room_number} ({self.move_in_date} to {self.move_out_date or 'Present'})"

    class Meta:
        ordering = ['-move_in_date']
        verbose_name = 'Tenant History'
        verbose_name_plural = 'Tenant Histories'


class QRCodeSettings(models.Model):
    """Admin UPI QR Code Settings"""
    upi_id = models.CharField(max_length=100, help_text="Your UPI ID (e.g., admin@paytm)")
    qr_code_image = models.TextField(blank=True, null=True)
    is_active = models.BooleanField(default=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"UPI: {self.upi_id}"

    class Meta:
        verbose_name = "QR Code Setting"
        verbose_name_plural = "QR Code Settings"


# ========================================
# OTP Model for Email Verification
# ========================================
class OTP(models.Model):
    """OTP Model for Email Verification"""
    email = models.EmailField()
    otp = models.CharField(max_length=6)
    created_at = models.DateTimeField(auto_now_add=True)
    is_verified = models.BooleanField(default=False)
    
    def __str__(self):
        return f"OTP - {self.email} - {self.otp}"
    
    def is_expired(self):
        """Check if OTP is expired (5 minutes)"""
        from django.utils.timezone import now
        return now() > self.created_at + timedelta(minutes=5)
    
    class Meta:
        ordering = ['-created_at']
        verbose_name = 'OTP'
        verbose_name_plural = 'OTPs'


# ========================================
# 🔥 NEW: Tenant Model for Tenant Login
# ========================================
class Tenant(models.Model):
    """Tenant model for tenant login and authentication"""
    room = models.OneToOneField(
        Room, 
        on_delete=models.CASCADE, 
        related_name='tenant_account',
        null=True,
        blank=True
    )
    name = models.CharField(max_length=100)
    mobile = models.CharField(max_length=15, unique=True)
    email = models.EmailField(blank=True, null=True)
    password = models.CharField(max_length=255, blank=True, null=True)  # Hashed password
    is_registered = models.BooleanField(default=False)
    registered_at = models.DateTimeField(null=True, blank=True)
    last_login = models.DateTimeField(null=True, blank=True)
    is_active = models.BooleanField(default=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"{self.name} - {self.mobile}"

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'Tenant'
        verbose_name_plural = 'Tenants'