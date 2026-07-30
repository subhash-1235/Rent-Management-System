from decimal import Decimal
from django.db.models import Sum
from .models import Room, RoomMeterReading, MonthlyBill


def calculate_room_bill(room_id, units, per_unit_rate, room_rent):
    """
    Calculate total bill for a room
    
    Args:
        room_id (int): Room ID
        units (float): Units consumed
        per_unit_rate (float): Rate per unit
        room_rent (float): Room rent
    
    Returns:
        dict: {
            'electricity_charge': Decimal,
            'total_amount': Decimal
        }
    """
    electricity_charge = Decimal(str(units)) * Decimal(str(per_unit_rate))
    total_amount = Decimal(str(room_rent)) + electricity_charge
    
    return {
        'electricity_charge': electricity_charge,
        'total_amount': total_amount
    }


def generate_monthly_report(month):
    """
    Generate monthly report for a specific month
    
    Args:
        month (date): Month date (first day of month)
    
    Returns:
        dict: {
            'month': date,
            'total_rooms': int,
            'total_units': Decimal,
            'total_amount': Decimal,
            'paid_amount': Decimal,
            'pending_amount': Decimal,
            'paid_count': int,
            'pending_count': int,
            'readings': QuerySet
        }
    """
    readings = RoomMeterReading.objects.filter(monthly_bill__month=month)
    
    total_units = readings.aggregate(Sum('units_consumed'))['units_consumed__sum'] or Decimal('0.00')
    total_amount = readings.aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    paid_amount = readings.filter(is_paid=True).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    pending_amount = readings.filter(is_paid=False).aggregate(Sum('total_amount'))['total_amount__sum'] or Decimal('0.00')
    
    report = {
        'month': month,
        'total_rooms': readings.count(),
        'total_units': total_units,
        'total_amount': total_amount,
        'paid_amount': paid_amount,
        'pending_amount': pending_amount,
        'paid_count': readings.filter(is_paid=True).count(),
        'pending_count': readings.filter(is_paid=False).count(),
        'readings': readings
    }
    
    return report