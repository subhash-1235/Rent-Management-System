from rest_framework import serializers
from django.contrib.auth.models import User
from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings
)

class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['id', 'username', 'email', 'first_name', 'last_name']


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
    
    class Meta:
        model = RoomMeterReading
        fields = '__all__'
    
    def get_remaining_amount(self, obj):
        return obj.total_amount - (obj.paid_amount or 0)


class PaymentHistorySerializer(serializers.ModelSerializer):
    room_reading_details = RoomMeterReadingSerializer(source='room_reading', read_only=True)
    created_by_name = serializers.SerializerMethodField()
    
    class Meta:
        model = PaymentHistory
        fields = '__all__'
    
    def get_created_by_name(self, obj):
        return obj.created_by.username if obj.created_by else None


class QRCodeSettingsSerializer(serializers.ModelSerializer):
    qr_code_url = serializers.SerializerMethodField()
    
    class Meta:
        model = QRCodeSettings
        fields = '__all__'
    
    def get_qr_code_url(self, obj):
        if obj.qr_code_image:
            return obj.qr_code_image.url
        return None