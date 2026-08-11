from rest_framework import viewsets, status, generics, permissions
from rest_framework.decorators import action, api_view, permission_classes
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated, AllowAny
from django.db.models import Sum, Count, Q, F
from django.utils import timezone
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from django.contrib.auth.models import User
from django.contrib.auth.hashers import make_password, check_password
from django.core.mail import send_mail
from decimal import Decimal
from datetime import datetime, date
import base64
import uuid
import os
import logging
import random
import string

from .models import (
    Room, MonthlyBill, RoomMeterReading, 
    PaymentHistory, QRCodeSettings, TenantHistory, OTP, Tenant
)
from .serializers import (
    RoomSerializer, MonthlyBillSerializer, 
    RoomMeterReadingSerializer, PaymentHistorySerializer,
    QRCodeSettingsSerializer, TenantHistorySerializer, UserSerializer,
    OTPSendSerializer, OTPVerifySerializer, OTPResendSerializer, CheckEmailSerializer,
    TenantSerializer, TenantRegisterSerializer, TenantLoginSerializer,
    TenantCheckMobileSerializer, TenantProfileUpdateSerializer, TenantChangePasswordSerializer
)

logger = logging.getLogger(__name__)


class RegisterView(generics.CreateAPIView):
    queryset = User.objects.all()
    permission_classes = [AllowAny]
    serializer_class = UserSerializer


# ========================================
# OTP Views
# ========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def check_email(request):
    """Check if email already exists in database"""
    serializer = CheckEmailSerializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        exists = User.objects.filter(email=email).exists()
        return Response({'exists': exists}, status=status.HTTP_200_OK)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def send_otp(request):
    """Send OTP to the provided email"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if email is already registered as admin
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'This email is already registered. Please login.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Generate 6-digit OTP
        otp = ''.join(random.choices(string.digits, k=6))
        
        # Delete old OTPs for this email
        OTP.objects.filter(email=email).delete()
        
        # Save new OTP
        otp_obj = OTP.objects.create(email=email, otp=otp)
        
        print(f"🔑 OTP generated for {email}: {otp}")
        
        # Send email
        try:
            subject = 'Your OTP for RentFlow Registration'
            message = f"""
Hello,

Your OTP for RentFlow registration is: {otp}

This OTP is valid for 5 minutes.

If you didn't request this, please ignore this email.

Regards,
RentFlow Team
"""
            send_mail(
                subject,
                message,
                'sunnynishad9770@gmail.com',
                [email],
                fail_silently=False,
            )
            
            # 🔥 REMOVED OTP from response
            return Response({
                'message': 'OTP sent successfully',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Email send error: {str(e)}")
            return Response({
                'error': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        print(f"❌ Send OTP error: {str(e)}")
        return Response({
            'error': f'Failed to send OTP: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def verify_otp(request):
    """Verify the OTP"""
    try:
        email = request.data.get('email')
        otp = request.data.get('otp')
        
        print(f"🔍 Verifying OTP - Email: {email}, OTP: {otp}")
        
        if not email or not otp:
            return Response({
                'error': 'Email and OTP are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            otp_obj = OTP.objects.get(email=email, otp=otp, is_verified=False)
        except OTP.DoesNotExist:
            verified_otp = OTP.objects.filter(email=email, otp=otp, is_verified=True).first()
            if verified_otp:
                return Response({
                    'error': 'This OTP has already been used. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            existing_otp = OTP.objects.filter(email=email).first()
            if existing_otp:
                return Response({
                    'error': 'Invalid OTP. Please check and try again.'
                }, status=status.HTTP_400_BAD_REQUEST)
            else:
                return Response({
                    'error': 'No OTP found for this email. Please request a new OTP.'
                }, status=status.HTTP_400_BAD_REQUEST)
        
        if otp_obj.is_expired():
            otp_obj.delete()
            return Response({
                'error': 'OTP has expired. Please request a new one.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        otp_obj.is_verified = True
        otp_obj.save()
        
        print(f"✅ OTP verified successfully for {email}")
        
        return Response({
            'message': 'OTP verified successfully',
            'verified': True
        }, status=status.HTTP_200_OK)
        
    except Exception as e:
        print(f"❌ OTP verification error: {str(e)}")
        return Response({
            'error': f'Verification failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def resend_otp(request):
    """Resend OTP to the provided email"""
    try:
        email = request.data.get('email')
        
        if not email:
            return Response({
                'error': 'Email is required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        if User.objects.filter(email=email).exists():
            return Response({
                'error': 'This email is already registered. Please login.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        otp = ''.join(random.choices(string.digits, k=6))
        
        OTP.objects.filter(email=email).delete()
        
        otp_obj = OTP.objects.create(email=email, otp=otp)
        
        print(f"🔄 New OTP generated for {email}: {otp}")
        
        try:
            subject = 'Your New OTP for RentFlow Registration'
            message = f"""
Hello,

Your new OTP for RentFlow registration is: {otp}

This OTP is valid for 5 minutes.

If you didn't request this, please ignore this email.

Regards,
RentFlow Team
"""
            send_mail(
                subject,
                message,
                'sunnynishad9770@gmail.com',
                [email],
                fail_silently=False,
            )
            
            # 🔥 REMOVED OTP from response
            return Response({
                'message': 'New OTP sent successfully',
                'email': email
            }, status=status.HTTP_200_OK)
            
        except Exception as e:
            print(f"❌ Email send error: {str(e)}")
            return Response({
                'error': f'Failed to send email: {str(e)}'
            }, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
    except Exception as e:
        print(f"❌ Resend OTP error: {str(e)}")
        return Response({
            'error': f'Failed to resend OTP: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# Tenant Views
# ========================================

@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_check_mobile(request):
    """Check if tenant exists with this mobile number"""
    serializer = TenantCheckMobileSerializer(data=request.data)
    if serializer.is_valid():
        mobile = serializer.validated_data['mobile']
        
        try:
            tenant = Tenant.objects.get(mobile=mobile)
            return Response({
                'exists': True,
                'is_registered': tenant.is_registered,
                'name': tenant.name,
                'email': tenant.email,
                'room_number': tenant.room.room_number if tenant.room else None,
                'room_rent': float(tenant.room.room_rent) if tenant.room else None,
            })
        except Tenant.DoesNotExist:
            return Response({
                'exists': False,
                'is_registered': False,
            })
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_register(request):
    """Register tenant with OTP verification"""
    try:
        mobile = request.data.get('mobile')
        name = request.data.get('name')
        email = request.data.get('email')
        password = request.data.get('password')
        otp = request.data.get('otp')
        
        print(f"📝 Tenant Register - Mobile: {mobile}, Email: {email}")
        
        if not all([mobile, name, email, password, otp]):
            return Response({
                'error': 'All fields are required'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Verify OTP
        try:
            otp_obj = OTP.objects.get(email=email, otp=otp, is_verified=False)
            if otp_obj.is_expired():
                otp_obj.delete()
                return Response({
                    'error': 'OTP has expired. Please request a new one.'
                }, status=status.HTTP_400_BAD_REQUEST)
        except OTP.DoesNotExist:
            return Response({
                'error': 'Invalid OTP. Please try again.'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        # Check if tenant already exists
        tenant, created = Tenant.objects.get_or_create(mobile=mobile)
        
        # Update tenant details
        tenant.name = name
        tenant.email = email
        tenant.password = make_password(password)
        tenant.is_registered = True
        tenant.registered_at = timezone.now()
        tenant.save()
        
        # Mark OTP as verified
        otp_obj.is_verified = True
        otp_obj.save()
        
        # Update Room with latest details
        if tenant.room:
            room = tenant.room
            room.tenant_name = name
            room.tenant_email = email
            room.save()
            print(f"✅ Room {room.room_number} updated with tenant: {name}")
        
        # Generate JWT token
        from rest_framework_simplejwt.tokens import RefreshToken
        refresh = RefreshToken()
        refresh['tenant_id'] = tenant.id
        refresh['mobile'] = tenant.mobile
        
        print(f"✅ Tenant registered successfully: {name} ({mobile})")
        
        return Response({
            'message': 'Registration successful!',
            'access': str(refresh.access_token),
            'refresh': str(refresh),
            'tenant': TenantSerializer(tenant).data
        })
        
    except Exception as e:
        print(f"❌ Tenant register error: {str(e)}")
        return Response({
            'error': f'Registration failed: {str(e)}'
        }, status=status.HTTP_400_BAD_REQUEST)


@api_view(['POST'])
@permission_classes([AllowAny])
def tenant_login(request):
    """Login tenant with mobile + password"""
    serializer = TenantLoginSerializer(data=request.data)
    if serializer.is_valid():
        mobile = serializer.validated_data['mobile']
        password = serializer.validated_data['password']
        
        try:
            tenant = Tenant.objects.get(mobile=mobile)
            
            if not tenant.is_registered:
                return Response({
                    'error': 'Account not registered. Please register first.'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            if not check_password(password, tenant.password):
                return Response({
                    'error': 'Invalid password'
                }, status=status.HTTP_401_UNAUTHORIZED)
            
            tenant.last_login = timezone.now()
            tenant.save()
            
            from rest_framework_simplejwt.tokens import RefreshToken
            refresh = RefreshToken()
            refresh['tenant_id'] = tenant.id
            refresh['mobile'] = tenant.mobile
            
            return Response({
                'message': 'Login successful!',
                'access': str(refresh.access_token),
                'refresh': str(refresh),
                'tenant': TenantSerializer(tenant).data
            })
            
        except Tenant.DoesNotExist:
            return Response({
                'error': 'Mobile number not found'
            }, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET', 'PUT'])
@permission_classes([IsAuthenticated])
def tenant_profile(request):
    """Get or update tenant profile"""
    try:
        tenant_id = request.user.id
        tenant = Tenant.objects.get(id=tenant_id)
        
        if request.method == 'GET':
            return Response(TenantSerializer(tenant).data)
        
        elif request.method == 'PUT':
            serializer = TenantProfileUpdateSerializer(tenant, data=request.data, partial=True)
            if serializer.is_valid():
                serializer.save()
                return Response({
                    'message': 'Profile updated successfully',
                    'tenant': TenantSerializer(tenant).data
                })
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
            
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tenant_change_password(request):
    """Change tenant password"""
    serializer = TenantChangePasswordSerializer(data=request.data)
    if serializer.is_valid():
        tenant_id = request.user.id
        old_password = serializer.validated_data['old_password']
        new_password = serializer.validated_data['new_password']
        
        try:
            tenant = Tenant.objects.get(id=tenant_id)
            
            if not check_password(old_password, tenant.password):
                return Response({
                    'error': 'Current password is incorrect'
                }, status=status.HTTP_400_BAD_REQUEST)
            
            tenant.password = make_password(new_password)
            tenant.save()
            
            return Response({
                'message': 'Password changed successfully'
            })
            
        except Tenant.DoesNotExist:
            return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['GET'])
@permission_classes([IsAuthenticated])
def tenant_bills(request):
    """Get all bills for the logged-in tenant"""
    try:
        tenant_id = request.user.id
        tenant = Tenant.objects.get(id=tenant_id)
        
        if not tenant.room:
            return Response({
                'bills': [],
                'message': 'No room assigned'
            })
        
        readings = RoomMeterReading.objects.filter(
            room=tenant.room
        ).select_related('monthly_bill').order_by('-monthly_bill__month')
        
        bills_data = []
        for reading in readings:
            bills_data.append({
                'id': reading.id,
                'month': reading.monthly_bill.month.strftime('%B %Y'),
                'month_key': reading.monthly_bill.month.strftime('%Y-%m'),
                'units_consumed': float(reading.units_consumed),
                'electricity_charge': float(reading.electricity_charge),
                'room_rent': float(reading.room_rent_snapshot or reading.room.room_rent),
                'total_amount': float(reading.total_amount),
                'paid_amount': float(reading.paid_amount or 0),
                'remaining': float(reading.total_amount - (reading.paid_amount or 0)),
                'is_paid': reading.is_paid,
                'payment_mode': reading.payment_mode,
                'paid_date': reading.paid_date,
            })
        
        total_bills = sum(b['total_amount'] for b in bills_data)
        total_paid = sum(b['paid_amount'] for b in bills_data)
        total_pending = total_bills - total_paid
        
        return Response({
            'bills': bills_data,
            'summary': {
                'total_bills': round(total_bills, 2),
                'total_paid': round(total_paid, 2),
                'total_pending': round(total_pending, 2),
                'paid_count': sum(1 for b in bills_data if b['is_paid']),
                'pending_count': sum(1 for b in bills_data if not b['is_paid']),
            }
        })
        
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)


@api_view(['POST'])
@permission_classes([IsAuthenticated])
def tenant_pay_bill(request):
    """Pay a bill for the tenant"""
    try:
        tenant_id = request.user.id
        tenant = Tenant.objects.get(id=tenant_id)
        
        reading_id = request.data.get('reading_id')
        amount = Decimal(str(request.data.get('amount', 0)))
        payment_mode = request.data.get('payment_mode', 'UPI')
        
        if not reading_id:
            return Response({'error': 'Reading ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        if amount <= 0:
            return Response({'error': 'Amount must be greater than 0'}, status=status.HTTP_400_BAD_REQUEST)
        
        reading = RoomMeterReading.objects.get(id=reading_id, room=tenant.room)
        
        total_amount = reading.total_amount
        already_paid = reading.paid_amount or Decimal('0.00')
        remaining = total_amount - already_paid
        
        if amount > remaining:
            return Response({
                'error': f'Amount cannot exceed remaining balance of ₹{remaining}'
            }, status=status.HTTP_400_BAD_REQUEST)
        
        reading.paid_amount = already_paid + amount
        reading.payment_mode = payment_mode
        
        if reading.paid_amount >= total_amount:
            reading.is_paid = True
            reading.paid_date = timezone.now()
        
        reading.save()
        
        payment = PaymentHistory.objects.create(
            room_reading=reading,
            amount=amount,
            payment_mode=payment_mode,
            transaction_id=request.data.get('transaction_id', f'TXN{timezone.now().timestamp()}'),
            remarks=request.data.get('remarks', 'Paid by tenant'),
            is_partial=amount < remaining
        )
        
        return Response({
            'message': 'Payment successful!',
            'is_paid': reading.is_paid,
            'paid_amount': float(reading.paid_amount),
            'remaining': float(total_amount - reading.paid_amount),
            'payment': PaymentHistorySerializer(payment).data
        })
        
    except Tenant.DoesNotExist:
        return Response({'error': 'Tenant not found'}, status=status.HTTP_404_NOT_FOUND)
    except RoomMeterReading.DoesNotExist:
        return Response({'error': 'Bill not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
        return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


# ========================================
# Existing Views (Unchanged)
# ========================================

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

    # 🔥 NEW: Upload Aadhar Card
    @action(detail=True, methods=['post'])
    def upload_aadhar(self, request, pk=None):
        """Upload Aadhar card images for a room"""
        try:
            room = self.get_object()
            aadhar_front = request.data.get('aadhar_front')
            aadhar_back = request.data.get('aadhar_back')
            
            if aadhar_front:
                room.aadhar_front = aadhar_front
            if aadhar_back:
                room.aadhar_back = aadhar_back
            
            room.save()
            
            return Response({
                'message': 'Aadhar card uploaded successfully',
                'aadhar_front': room.aadhar_front,
                'aadhar_back': room.aadhar_back,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    # 🔥 NEW: Get Aadhar Card
    @action(detail=True, methods=['get'])
    def get_aadhar(self, request, pk=None):
        """Get Aadhar card images for a room"""
        try:
            room = self.get_object()
            return Response({
                'aadhar_front': room.aadhar_front,
                'aadhar_back': room.aadhar_back,
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response(
                {'error': str(e)},
                status=status.HTTP_400_BAD_REQUEST
            )

    def perform_update(self, serializer):
        """Override update to save tenant history and handle room deletion"""
        instance = self.get_object()
        
        old_tenant_name = instance.tenant_name
        old_tenant_mobile = instance.tenant_mobile
        old_tenant_email = instance.tenant_email
        old_room_rent = instance.room_rent
        old_address = instance.address
        old_move_in_date = instance.move_in_date
        
        updated_instance = serializer.save()
        
        new_tenant_name = updated_instance.tenant_name
        new_is_deleted = updated_instance.is_deleted
        
        if old_tenant_name and not new_tenant_name:
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
            
            updated_instance.tenant_name = old_tenant_name
            updated_instance.tenant_mobile = old_tenant_mobile
            updated_instance.tenant_email = old_tenant_email
            updated_instance.room_rent = old_room_rent
            updated_instance.address = old_address
            updated_instance.move_in_date = old_move_in_date
            updated_instance.is_active = False
            
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
            
            if reading.room.tenant_name and reading.room.tenant_name.strip():
                reading.tenant_name_snapshot = reading.room.tenant_name
                reading.tenant_mobile_snapshot = reading.room.tenant_mobile or ''
                reading.room_rent_snapshot = reading.room.room_rent
            else:
                previous_reading = RoomMeterReading.objects.filter(
                    room=reading.room,
                    monthly_bill__month__lt=bill.month
                ).exclude(
                    Q(tenant_name_snapshot='') | Q(tenant_name_snapshot__isnull=True)
                ).order_by('-monthly_bill__month').first()
                
                if previous_reading and previous_reading.tenant_name_snapshot:
                    reading.tenant_name_snapshot = previous_reading.tenant_name_snapshot
                    reading.tenant_mobile_snapshot = previous_reading.tenant_mobile_snapshot or ''
                    reading.room_rent_snapshot = previous_reading.room_rent_snapshot or reading.room.room_rent
                else:
                    reading.tenant_name_snapshot = ''
                    reading.tenant_mobile_snapshot = ''
                    reading.room_rent_snapshot = reading.room.room_rent
            
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
            
            current_month = date.today().replace(day=1)
            current_bill = MonthlyBill.objects.filter(
                month=current_month
            ).first()
            
            readings = RoomMeterReading.objects.filter(
                monthly_bill=current_bill
            ) if current_bill else RoomMeterReading.objects.none()
            
            total_rooms = Room.objects.filter(is_active=True, is_deleted=False).count()
            total_rent = Room.objects.filter(is_active=True, is_deleted=False).aggregate(
                total=Sum('room_rent')
            )['total'] or 0
            
            current_month_paid = readings.aggregate(
                total=Sum('paid_amount')
            )['total'] or 0
            
            current_month_total = readings.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            current_month_pending = current_month_total - current_month_paid
            
            overall_paid = PaymentHistory.objects.aggregate(
                total=Sum('amount')
            )['total'] or 0
            
            overall_total = RoomMeterReading.objects.aggregate(
                total=Sum('total_amount')
            )['total'] or 0
            
            overall_pending = overall_total - overall_paid
            
            room_data = []
            for reading in readings:
                room = reading.room
                tenant_name = reading.tenant_name_snapshot or room.tenant_name or '—'
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