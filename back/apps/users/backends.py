from django.contrib.auth.backends import ModelBackend
from django.db.models import Q

from apps.users.models import User


class EmailOrPhoneBackend(ModelBackend):
    """Вход по почте или телефону (поле login на фронте)."""

    def authenticate(self, request, username=None, password=None, **kwargs):
        login = (username or kwargs.get("email") or "").strip()
        if not login or not password:
            return None
        user = User.objects.filter(Q(email__iexact=login) | Q(phone=login)).first()
        if user and user.check_password(password) and self.user_can_authenticate(user):
            return user
        return None
