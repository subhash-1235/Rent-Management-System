from decimal import Decimal
from .models import Room, RoomMeterReading, MonthlyBill

def calculate_room_bill(room_id, units, per_unit_rate, room_rent):
    """Calculate total bill for a room"""
    electricity_charge = Decimal(str(units)) * Decimal(str(per_unit_rate))
    total_amount = Decimal(str(room_rent)) + electricity_charge
    return {
        'electricity_charge': electricity_charge,
        'total_amount': total_amount
    }

def generate_monthly_report(month):
    """Generate monthly report for a specific month"""
    readings = RoomMeterReading.objects.filter(monthly_bill__month=month)
    
    report = {
        'month': month,
        'total_rooms': readings.count(),
        'total_units': readings.aggregate(Sum('units_consumed'))['units_consumed__sum'] or 0,
        'total_amount': readings.aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'paid_amount': readings.filter(is_paid=True).aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'pending_amount': readings.filter(is_paid=False).aggregate(Sum('total_amount'))['total_amount__sum'] or 0,
        'paid_count': readings.filter(is_paid=True).count(),
        'pending_count': readings.filter(is_paid=False).count(),
        'readings': readings
    }
    
    return report