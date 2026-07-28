from rest_framework.permissions import BasePermission

class IsAdminUser(BasePermission):
    """Allow only admin users"""
    def has_permission(self, request, view):
        return request.user and request.user.is_staff

class IsTenantUser(BasePermission):
    """Allow only tenant users"""
    def has_permission(self, request, view):
        return request.user and not request.user.is_staff

class IsAdminOrReadOnly(BasePermission):
    """Admin can do everything, others can only read"""
    def has_permission(self, request, view):
        if request.method in ['GET', 'HEAD', 'OPTIONS']:
            return True
        return request.user and request.user.is_staff