from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password
from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings, TenantHistory, OTP, Tenant
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name', 'password']
        extra_kwargs = {'password': {'write_only': True}}

    def create(self, validated_data):
        user = User.objects.create_user(
            username=validated_data['username'],
            email=validated_data.get('email', ''),
            password=validated_data['password']
        )
        return user


class RoomSerializer(serializers.ModelSerializer):
    class Meta:
        model = Room
        fields = '__all__'


class MonthlyBillSerializer(serializers.ModelSerializer):
    month_display = serializers.SerializerMethodField()
    
    class Meta:
        model = MonthlyBill
        fields = '__all__'
    
    def get_month_display(self, obj):
        return obj.month.strftime('%B %Y')


class RoomMeterReadingSerializer(serializers.ModelSerializer):
    room_details = RoomSerializer(source='room', read_only=True)
    monthly_bill_details = MonthlyBillSerializer(source='monthly_bill', read_only=True)
    remaining_amount = serializers.SerializerMethodField()
    tenant_display_name = serializers.SerializerMethodField()
    
    class Meta:
        model = RoomMeterReading
        fields = '__all__'
    
    def get_remaining_amount(self, obj):
        return obj.total_amount - (obj.paid_amount or 0)
    
    def get_tenant_display_name(self, obj):
        if obj.tenant_name_snapshot:
            return obj.tenant_name_snapshot
        if obj.room and obj.room.tenant_name:
            return obj.room.tenant_name
        return '—'


class PaymentHistorySerializer(serializers.ModelSerializer):
    room_reading_details = RoomMeterReadingSerializer(source='room_reading', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    bill_month = serializers.SerializerMethodField()
    bill_month_key = serializers.SerializerMethodField()
    room_number = serializers.SerializerMethodField()
    tenant_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentHistory
        fields = '__all__'
    
    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else None
    
    def get_bill_month(self, obj):
        if obj.room_reading and obj.room_reading.monthly_bill:
            month_date = obj.room_reading.monthly_bill.month
            return month_date.strftime('%B %Y')
        return None
    
    def get_bill_month_key(self, obj):
        if obj.room_reading and obj.room_reading.monthly_bill:
            month_date = obj.room_reading.monthly_bill.month
            return month_date.strftime('%Y-%m')
        return None
    
    def get_room_number(self, obj):
        if obj.room_reading and obj.room_reading.room:
            return obj.room_reading.room.room_number
        return None
    
    def get_tenant_name(self, obj):
        if obj.room_reading:
            if obj.room_reading.tenant_name_snapshot:
                return obj.room_reading.tenant_name_snapshot
            if obj.room_reading.room and obj.room_reading.room.tenant_name:
                return obj.room_reading.room.tenant_name
        return 'N/A'


class QRCodeSettingsSerializer(serializers.ModelSerializer):
    class Meta:
        model = QRCodeSettings
        fields = '__all__'


class TenantHistorySerializer(serializers.ModelSerializer):
    room_number = serializers.IntegerField(source='room.room_number', read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    stay_duration_days = serializers.SerializerMethodField()
    is_active = serializers.SerializerMethodField()
    
    class Meta:
        model = TenantHistory
        fields = '__all__'
    
    def get_stay_duration_days(self, obj):
        if obj.move_in_date and obj.move_out_date:
            return (obj.move_out_date - obj.move_in_date).days
        elif obj.move_in_date:
            from datetime import date
            return (date.today() - obj.move_in_date).days
        return None
    
    def get_is_active(self, obj):
        return obj.move_out_date is None


# ========================================
# OTP Serializers
# ========================================

class OTPSendSerializer(serializers.Serializer):
    """Serializer for sending OTP"""
    email = serializers.EmailField(required=True, help_text="Email address to send OTP")


class OTPVerifySerializer(serializers.Serializer):
    """Serializer for verifying OTP"""
    email = serializers.EmailField(required=True)
    otp = serializers.CharField(max_length=6, required=True, help_text="6-digit OTP")


class OTPResendSerializer(serializers.Serializer):
    """Serializer for resending OTP"""
    email = serializers.EmailField(required=True)


class CheckEmailSerializer(serializers.Serializer):
    """Serializer for checking if email exists"""
    email = serializers.EmailField(required=True)


class OTPSerializer(serializers.ModelSerializer):
    """Serializer for OTP model"""
    is_expired = serializers.SerializerMethodField()
    
    class Meta:
        model = OTP
        fields = ['id', 'email', 'otp', 'created_at', 'is_verified', 'is_expired']
    
    def get_is_expired(self, obj):
        return obj.is_expired()


# ========================================
# 🔥 NEW: Tenant Serializers
# ========================================

class TenantSerializer(serializers.ModelSerializer):
    """Serializer for Tenant model"""
    room_number = serializers.IntegerField(source='room.room_number', read_only=True)
    room_rent = serializers.DecimalField(source='room.room_rent', max_digits=10, decimal_places=2, read_only=True)
    room_details = RoomSerializer(source='room', read_only=True)
    
    class Meta:
        model = Tenant
        fields = [
            'id', 'name', 'mobile', 'email', 
            'room_number', 'room_rent', 'room_details',
            'is_registered', 'registered_at', 'last_login',
            'is_active', 'created_at'
        ]


class TenantRegisterSerializer(serializers.Serializer):
    """Serializer for tenant registration"""
    mobile = serializers.CharField(max_length=15, required=True)
    name = serializers.CharField(max_length=100, required=True)
    email = serializers.EmailField(required=True)
    password = serializers.CharField(min_length=6, required=True, write_only=True)
    otp = serializers.CharField(max_length=6, required=True)


class TenantLoginSerializer(serializers.Serializer):
    """Serializer for tenant login"""
    mobile = serializers.CharField(max_length=15, required=True)
    password = serializers.CharField(required=True, write_only=True)


class TenantCheckMobileSerializer(serializers.Serializer):
    """Serializer for checking if mobile exists"""
    mobile = serializers.CharField(max_length=15, required=True)


class TenantProfileUpdateSerializer(serializers.ModelSerializer):
    """Serializer for updating tenant profile"""
    class Meta:
        model = Tenant
        fields = ['name', 'email']
        extra_kwargs = {
            'name': {'required': False},
            'email': {'required': False},
        }


class TenantChangePasswordSerializer(serializers.Serializer):
    """Serializer for changing tenant password"""
    old_password = serializers.CharField(required=True, write_only=True)
    new_password = serializers.CharField(min_length=6, required=True, write_only=True)