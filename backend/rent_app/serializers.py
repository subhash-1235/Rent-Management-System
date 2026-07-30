from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings, TenantHistory
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
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = QRCodeSettings
        fields = '__all__'
    
    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            return obj.qr_code_image.url
        return None


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