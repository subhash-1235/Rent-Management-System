from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from decimal import Decimal
from datetime import datetime, date
import base64
import uuid
import os

from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings
)
from .serializers import (
    RoomSerializer, MonthlyBillSerializer, 
    RoomMeterReadingSerializer, PaymentHistorySerializer,
    QRCodeSettingsSerializer
)


class RoomViewSet(viewsets.ModelViewSet):
    """API for Rooms"""
    queryset = Room.objects.all()
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def active_rooms(self, request):
        """Get all active rooms"""
        rooms = Room.objects.filter(is_active=True)
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)


class MonthlyBillViewSet(viewsets.ModelViewSet):
    """API for Monthly Bills"""
    queryset = MonthlyBill.objects.all()
    serializer_class = MonthlyBillSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def calculate_readings(self, request, pk=None):
        """Calculate all room readings for a bill"""
        bill = self.get_object()
        
        readings = RoomMeterReading.objects.filter(monthly_bill=bill)
        
        if not readings.exists():
            return Response(
                {'error': 'No readings found for this bill'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_units = readings.aggregate(Sum('units_consumed'))['units_consumed__sum'] or Decimal('0.00')
        
        if total_units == 0:
            return Response(
                {'error': 'Total units cannot be zero'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        per_unit_rate = bill.per_unit_rate
        
        for reading in readings:
            reading.electricity_charge = reading.units_consumed * per_unit_rate
            reading.total_amount = reading.room.room_rent + reading.electricity_charge
            reading.save()
        
        bill.total_units = total_units
        bill.total_bill_amount = readings.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
        bill.save()
        
        serializer = RoomMeterReadingSerializer(readings, many=True)
        return Response({
            'message': 'Calculations completed',
            'total_units': total_units,
            'per_unit_rate': per_unit_rate,
            'total_amount': bill.total_bill_amount,
            'readings': serializer.data
        })


class RoomMeterReadingViewSet(viewsets.ModelViewSet):
    """API for Room Meter Readings"""
    queryset = RoomMeterReading.objects.all()
    serializer_class = RoomMeterReadingSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        """Mark a reading as paid (supports partial payment)"""
        reading = self.get_object()
        
        # Get payment data
        payment_mode = request.data.get('payment_mode', 'CASH')
        amount = Decimal(str(request.data.get('amount', 0)))
        
        if amount <= 0:
            return Response(
                {'error': 'Amount must be greater than 0'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        total_amount = reading.total_amount
        already_paid = reading.paid_amount or Decimal('0.00')
        remaining = total_amount - already_paid
        
        if amount > remaining:
            return Response(
                {'error': f'Amount cannot exceed remaining balance of ₹{remaining}'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update paid amount
        reading.paid_amount = already_paid + amount
        reading.payment_mode = payment_mode
        
        # Check if fully paid
        if reading.paid_amount >= total_amount:
            reading.is_paid = True
            reading.paid_date = timezone.now()
        else:
            reading.is_paid = False
        
        reading.save()
        
        # Create payment history
        PaymentHistory.objects.create(
            room_reading=reading,
            amount=amount,
            payment_mode=payment_mode,
            transaction_id=request.data.get('transaction_id', ''),
            remarks=request.data.get('remarks', ''),
            created_by=request.user,
            is_partial=amount < remaining
        )
        
        return Response({
            'message': 'Payment recorded successfully',
            'is_paid': reading.is_paid,
            'paid_amount': reading.paid_amount,
            'remaining': total_amount - reading.paid_amount,
            'reading': self.get_serializer(reading).data
        })

    @action(detail=False, methods=['get'])
    def by_month(self, request):
        """Get all readings for a specific month"""
        month = request.query_params.get('month')
        if not month:
            return Response(
                {'error': 'Month parameter required (YYYY-MM-DD)'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
        
        try:
            month_date = datetime.strptime(month, '%Y-%m-%d').date()
            readings = RoomMeterReading.objects.filter(
                monthly_bill__month=month_date
            )
            serializer = self.get_serializer(readings, many=True)
            return Response(serializer.data)
        except ValueError:
            return Response(
                {'error': 'Invalid month format. Use YYYY-MM-DD'}, 
                status=status.HTTP_400_BAD_REQUEST
            )


class PaymentHistoryViewSet(viewsets.ModelViewSet):
    """API for Payment History"""
    queryset = PaymentHistory.objects.all()
    serializer_class = PaymentHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        month = self.request.query_params.get('month')
        if month:
            try:
                month_date = datetime.strptime(month, '%Y-%m-%d').date()
                return PaymentHistory.objects.filter(
                    payment_date__year=month_date.year,
                    payment_date__month=month_date.month
                )
            except ValueError:
                pass
        return PaymentHistory.objects.all()

    @action(detail=False, methods=['get'])
    def summary(self, request):
        """Get payment summary"""
        total_collected = PaymentHistory.objects.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        total_transactions = PaymentHistory.objects.count()
        
        current_month = timezone.now().month
        current_year = timezone.now().year
        
        monthly_collected = PaymentHistory.objects.filter(
            payment_date__year=current_year,
            payment_date__month=current_month
        ).aggregate(total=Sum('amount'))['total'] or 0
        
        mode_breakdown = PaymentHistory.objects.values('payment_mode').annotate(
            total=Sum('amount'),
            count=Count('id')
        )
        
        return Response({
            'total_collected': total_collected,
            'total_transactions': total_transactions,
            'monthly_collected': monthly_collected,
            'mode_breakdown': mode_breakdown,
        })


class QRCodeSettingsViewSet(viewsets.ModelViewSet):
    """API for QR Code Settings"""
    queryset = QRCodeSettings.objects.all()
    serializer_class = QRCodeSettingsSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['post'])
    def upload_qr(self, request):
        """Upload QR Code image"""
        try:
            image_data = request.data.get('image')
            upi_id = request.data.get('upi_id')
            
            if not image_data:
                return Response(
                    {'error': 'Image data is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            if not upi_id:
                return Response(
                    {'error': 'UPI ID is required'},
                    status=status.HTTP_400_BAD_REQUEST
                )
            
            # Decode base64 image
            format, imgstr = image_data.split(';base64,')
            ext = format.split('/')[-1]
            filename = f"qr_{uuid.uuid4()}.{ext}"
            
            file_path = default_storage.save(
                f'qr_codes/{filename}',
                ContentFile(base64.b64decode(imgstr))
            )
            
            qr_settings, created = QRCodeSettings.objects.get_or_create(
                is_active=True,
                defaults={'upi_id': upi_id}
            )
            
            if not created:
                qr_settings.upi_id = upi_id
            
            qr_settings.qr_code_image = file_path
            qr_settings.save()
            
            serializer = self.get_serializer(qr_settings)
            return Response({
                'message': 'QR Code uploaded successfully',
                'data': serializer.data
            })
            
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DashboardViewSet(viewsets.ViewSet):
    """API for Dashboard Stats"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics"""
        total_rooms = Room.objects.filter(is_active=True).count()
        total_rent = Room.objects.filter(is_active=True).aggregate(
            total=Sum('room_rent')
        )['total'] or 0
        
        current_month = date.today().replace(day=1)
        
        current_bill = MonthlyBill.objects.filter(
            month=current_month
        ).first()
        
        readings = RoomMeterReading.objects.filter(
            monthly_bill=current_bill
        ) if current_bill else RoomMeterReading.objects.none()
        
        # Calculate with paid_amount for partial payments
        paid_amount = readings.aggregate(
            total=Sum('paid_amount')
        )['total'] or 0
        
        total_amount = readings.aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        pending_amount = total_amount - paid_amount
        
        paid_count = readings.filter(is_paid=True).count()
        total_count = readings.count()
        
        total_collected = PaymentHistory.objects.aggregate(
            total=Sum('amount')
        )['total'] or 0
        
        highest_rent_room = Room.objects.filter(is_active=True).order_by('-room_rent').first()
        
        return Response({
            'total_rooms': total_rooms,
            'total_monthly_rent': total_rent,
            'total_amount': total_amount,
            'paid_amount': paid_amount,
            'pending_amount': pending_amount,
            'paid_count': paid_count,
            'pending_count': total_count - paid_count,
            'total_units': readings.aggregate(
                total=Sum('units_consumed')
            )['total'] or 0,
            'total_collected': total_collected,
            'month': current_month.strftime('%B %Y'),
            'highest_rent_room': {
                'room': highest_rent_room.room_number if highest_rent_room else None,
                'tenant': highest_rent_room.tenant_name if highest_rent_room else None,
                'rent': highest_rent_room.room_rent if highest_rent_room else 0,
            } if highest_rent_room else None
        })