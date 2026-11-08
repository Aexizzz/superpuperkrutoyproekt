from rest_framework.permissions import SAFE_METHODS, BasePermission


def is_admin(user) -> bool:
    return bool(user and user.is_authenticated and user.role == "admin")


class IsAdminRole(BasePermission):
    message = "Недостаточно прав"

    def has_permission(self, request, view):
        return is_admin(request.user)


class IsAdminOrReadOnly(BasePermission):
    """Читать могут все, изменять — только администратор."""

    message = "Недостаточно прав"

    def has_permission(self, request, view):
        return request.method in SAFE_METHODS or is_admin(request.user)
