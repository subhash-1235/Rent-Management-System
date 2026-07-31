from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from decimal import Decimal
from datetime import datetime, date
import base64
import uuid
import os
import logging

from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings, TenantHistory
)
from .serializers import (
    RoomSerializer, MonthlyBillSerializer, 
    RoomMeterReadingSerializer, PaymentHistorySerializer,
    QRCodeSettingsSerializer, TenantHistorySerializer, UserSerializer
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer


class RoomViewSet(viewsets.ModelViewSet):
    queryset = Room.objects.filter(is_deleted=False)
    serializer_class = RoomSerializer
    permission_classes = [IsAuthenticated]

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        instance.is_deleted = True
        instance.save()
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def active_rooms(self, request):
        rooms = Room.objects.filter(is_active=True, is_deleted=False)
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def all_rooms(self, request):
        rooms = Room.objects.all()
        serializer = self.get_serializer(rooms, many=True)
        return Response(serializer.data)

    def perform_update(self, serializer):
        """Override update to save tenant history and handle room deletion"""
        instance = self.get_object()
        
        # Save old tenant details BEFORE update
        old_tenant_name = instance.tenant_name
        old_tenant_mobile = instance.tenant_mobile
        old_tenant_email = instance.tenant_email
        old_room_rent = instance.room_rent
        old_address = instance.address
        old_move_in_date = instance.move_in_date
        
        # Save the updated instance
        updated_instance = serializer.save()
        
        # Check if room became vacant (tenant removed)
        new_tenant_name = updated_instance.tenant_name
        new_is_deleted = updated_instance.is_deleted
        
        if old_tenant_name and not new_tenant_name:
            # Room became vacant - save tenant history with ALL details
            history = TenantHistory.objects.create(
                room=updated_instance,
                tenant_name=old_tenant_name,
                tenant_mobile=old_tenant_mobile,
                tenant_email=old_tenant_email,
                room_rent=old_room_rent,
                address=old_address,
                move_in_date=old_move_in_date,
                move_out_date=date.today(),
                aadhar_data={}
            )
            
            # Update total paid and bills
            tenant_readings = RoomMeterReading.objects.filter(
                room=updated_instance,
                tenant_name_snapshot=old_tenant_name
            )
            
            total_paid = PaymentHistory.objects.filter(
                room_reading__in=tenant_readings
            ).aggregate(total=Sum('amount'))['total'] or 0
            
            total_bills = tenant_readings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            history.total_paid = total_paid
            history.total_bills = total_bills
            history.save()
            
            # 🔥 FIX: Keep ALL old details in room for display
            # Don't clear anything when room becomes vacant
            updated_instance.tenant_name = old_tenant_name
            updated_instance.tenant_mobile = old_tenant_mobile
            updated_instance.tenant_email = old_tenant_email
            updated_instance.room_rent = old_room_rent
            updated_instance.address = old_address
            updated_instance.move_in_date = old_move_in_date
            updated_instance.is_active = False  # Only mark as inactive
            
            if new_is_deleted:
                updated_instance.is_deleted = True
            else:
                updated_instance.is_deleted = False
            
            updated_instance.save()
        
        if new_is_deleted and updated_instance.tenant_name:
            updated_instance.is_deleted = False
            updated_instance.save()


class MonthlyBillViewSet(viewsets.ModelViewSet):
    queryset = MonthlyBill.objects.all()
    serializer_class = MonthlyBillSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def calculate_readings(self, request, pk=None):
        """Calculate all room readings for a bill and save tenant snapshots"""
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
            
            # 🔥 Save snapshot with mobile number
            if reading.room.tenant_name and reading.room.tenant_name.strip():
                reading.tenant_name_snapshot = reading.room.tenant_name
                reading.tenant_mobile_snapshot = reading.room.tenant_mobile or ''
            else:
                # Try previous month snapshot
                previous_reading = RoomMeterReading.objects.filter(
                    room=reading.room,
                    monthly_bill__month__lt=bill.month
                ).exclude(
                    Q(tenant_name_snapshot='') | Q(tenant_name_snapshot__isnull=True)
                ).order_by('-monthly_bill__month').first()
                
                if previous_reading and previous_reading.tenant_name_snapshot:
                    reading.tenant_name_snapshot = previous_reading.tenant_name_snapshot
                    reading.tenant_mobile_snapshot = previous_reading.tenant_mobile_snapshot or ''
                else:
                    # Try PaymentHistory as last resort
                    last_payment = PaymentHistory.objects.filter(
                        room_reading__room=reading.room
                    ).order_by('-payment_date').first()
                    
                    if last_payment and last_payment.room_reading.tenant_name_snapshot:
                        reading.tenant_name_snapshot = last_payment.room_reading.tenant_name_snapshot
                        reading.tenant_mobile_snapshot = last_payment.room_reading.tenant_mobile_snapshot or ''
                    else:
                        reading.tenant_name_snapshot = ''
                        reading.tenant_mobile_snapshot = ''
            
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
    queryset = RoomMeterReading.objects.all()
    serializer_class = RoomMeterReadingSerializer
    permission_classes = [IsAuthenticated]

    @action(detail=True, methods=['post'])
    def mark_paid(self, request, pk=None):
        reading = self.get_object()
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
        
        reading.paid_amount = already_paid + amount
        reading.payment_mode = payment_mode
        
        if reading.paid_amount >= total_amount:
            reading.is_paid = True
            reading.paid_date = timezone.now()
        else:
            reading.is_paid = False
        
        reading.save()
        
        payment = PaymentHistory.objects.create(
            room_reading=reading,
            amount=amount,
            payment_mode=payment_mode,
            transaction_id=request.data.get('transaction_id', ''),
            remarks=request.data.get('remarks', ''),
            created_by=request.user,
            is_partial=amount < remaining
        )
        
        serializer = PaymentHistorySerializer(payment)
        return Response({
            'message': 'Payment recorded successfully',
            'is_paid': reading.is_paid,
            'paid_amount': reading.paid_amount,
            'remaining': total_amount - reading.paid_amount,
            'payment': serializer.data,
            'reading': self.get_serializer(reading).data
        })

    @action(detail=False, methods=['get'])
    def by_month(self, request):
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
    queryset = QRCodeSettings.objects.all()
    serializer_class = QRCodeSettingsSerializer
    permission_classes = [IsAuthenticated]

    def update(self, request, *args, **kwargs):
        partial = kwargs.pop('partial', False)
        instance = self.get_object()
        if 'qr_code_image' in request.data:
            if request.data['qr_code_image'] == '' or request.data['qr_code_image'] is None:
                request.data.pop('qr_code_image')
        serializer = self.get_serializer(instance, data=request.data, partial=partial)
        serializer.is_valid(raise_exception=True)
        self.perform_update(serializer)
        return Response(serializer.data)

    @action(detail=False, methods=['post'])
    def upload_qr(self, request):
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
            if ';base64,' in image_data:
                format, imgstr = image_data.split(';base64,')
                ext = format.split('/')[-1]
            else:
                imgstr = image_data
                ext = 'png'
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
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )


class DashboardViewSet(viewsets.ViewSet):
    """API for Dashboard Stats"""
    permission_classes = [IsAuthenticated]

    @action(detail=False, methods=['get'])
    def stats(self, request):
        """Get dashboard statistics with room-wise bill details and pending dues"""
        try:
            from datetime import date
            
            # Get current month
            current_month = date.today().replace(day=1)
            
            # Get current month bill
            current_bill = MonthlyBill.objects.filter(
                month=current_month
            ).first()
            
            # Get readings for current month
            readings = RoomMeterReading.objects.filter(
                monthly_bill=current_bill
            ) if current_bill else RoomMeterReading.objects.none()
            
            # Calculate totals
            total_rooms = Room.objects.filter(is_active=True, is_deleted=False).count()
            total_rent = Room.objects.filter(is_active=True, is_deleted=False).aggregate(
                total=Sum('room_rent')
            )['total'] or 0
            
            # Current month stats
            current_month_paid = readings.aggregate(
                total=Sum('paid_amount')
            )['total'] or 0
            
            current_month_total = readings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            current_month_pending = current_month_total - current_month_paid
            
            # Overall stats (all time)
            overall_paid = PaymentHistory.objects.aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            overall_total = RoomMeterReading.objects.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            overall_pending = overall_total - overall_paid
            
            # Get room-wise data with mobile from snapshot
            room_data = []
            for reading in readings:
                room = reading.room
                tenant_name = reading.tenant_name_snapshot or room.tenant_name or '—'
                # 🔥 Get mobile from snapshot or room
                tenant_mobile = reading.tenant_mobile_snapshot or room.tenant_mobile or '—'
                room_data.append({
                    'room_number': room.room_number,
                    'tenant_name': tenant_name,
                    'tenant_mobile': tenant_mobile,
                    'units_consumed': float(reading.units_consumed),
                    'room_rent': float(room.room_rent),
                    'electricity_charge': float(reading.electricity_charge),
                    'total_amount': float(reading.total_amount),
                    'paid_amount': float(reading.paid_amount or 0),
                    'remaining': float(reading.total_amount - (reading.paid_amount or 0)),
                    'is_paid': reading.is_paid,
                })
            
            # Calculate pending dues from ALL previous months
            pending_dues = []
            
            pending_readings = RoomMeterReading.objects.filter(
                paid_amount__lt=F('total_amount')
            ).exclude(
                monthly_bill__month=current_month
            ).select_related('room', 'monthly_bill')
            
            for reading in pending_readings:
                total = float(reading.total_amount)
                paid = float(reading.paid_amount or 0)
                pending = total - paid
                
                if pending > 0.01:
                    tenant_name = reading.tenant_name_snapshot or reading.room.tenant_name or 'Unknown'
                    pending_dues.append({
                        'id': reading.id,
                        'tenant_name': tenant_name,
                        'room_number': reading.room.room_number,
                        'month': reading.monthly_bill.month.strftime('%B %Y'),
                        'total_amount': round(total, 2),
                        'paid_amount': round(paid, 2),
                        'pending_amount': round(pending, 2),
                    })
            
            # Calculate summary
            total_pending_all = sum(d['pending_amount'] for d in pending_dues)
            total_paid_all = sum(d['paid_amount'] for d in pending_dues)
            total_bill_all = sum(d['total_amount'] for d in pending_dues)
            
            return Response({
                'total_rooms': total_rooms,
                'total_monthly_rent': float(total_rent),
                'current_month_total': float(current_month_total),
                'current_month_paid': float(current_month_paid),
                'current_month_pending': float(current_month_pending),
                'overall_total': float(overall_total),
                'overall_paid': float(overall_paid),
                'overall_pending': float(overall_pending),
                'paid_count': readings.filter(is_paid=True).count(),
                'pending_count': readings.filter(is_paid=False).count(),
                'total_units': float(readings.aggregate(total=Sum('units_consumed'))['total'] or 0),
                'month': current_month.strftime('%B %Y'),
                'room_data': room_data,
                'pending_dues': pending_dues,
                'pending_summary': {
                    'total_pending': round(total_pending_all, 2),
                    'total_paid': round(total_paid_all, 2),
                    'total_bill': round(total_bill_all, 2),
                    'count': len(pending_dues),
                }
            })
            
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {'error': str(e)},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


class TenantHistoryViewSet(viewsets.ModelViewSet):
    queryset = TenantHistory.objects.all()
    serializer_class = TenantHistorySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        queryset = TenantHistory.objects.all()
        room_id = self.request.query_params.get('room_id')
        if room_id:
            queryset = queryset.filter(room_id=room_id)
        tenant_name = self.request.query_params.get('tenant_name')
        if tenant_name:
            queryset = queryset.filter(tenant_name__icontains=tenant_name)
        return queryset.order_by('-move_in_date')

    @action(detail=False, methods=['get'])
    def all_tenants(self, request):
        tenants = TenantHistory.objects.all().order_by('-move_in_date')
        serializer = self.get_serializer(tenants, many=True)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def active_tenants(self, request):
        tenants = TenantHistory.objects.filter(move_out_date__isnull=True)
        serializer = self.get_serializer(tenants, many=True)
        return Response(serializer.data)