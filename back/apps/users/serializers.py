from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.exceptions import ApiException
from apps.users.models import User

PHONE_ERROR = "Введите номер в формате +7 (900) 000-00-00"


def _check_unique_email(email: str, exclude_pk=None) -> str:
    email = email.strip().lower()
    qs = User.objects.filter(email__iexact=email)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    if qs.exists():
        raise ApiException(409, "email_taken", "Эта почта уже зарегистрирована", {"email": "Почта уже занята"})
    return email


def _check_unique_phone(phone: str, exclude_pk=None) -> str:
    phone = phone.strip()
    if sum(ch.isdigit() for ch in phone) < 10:
        raise serializers.ValidationError(PHONE_ERROR)
    qs = User.objects.filter(phone=phone)
    if exclude_pk:
        qs = qs.exclude(pk=exclude_pk)
    if qs.exists():
        raise ApiException(409, "phone_taken", "Этот телефон уже зарегистрирован", {"phone": "Телефон уже занят"})
    return phone


class UserSerializer(serializers.ModelSerializer):
    created_at = serializers.DateTimeField(source="date_joined", read_only=True)

    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone", "role", "bonuses", "created_at"]
        read_only_fields = ["id", "role", "bonuses"]

    def validate_email(self, value):
        return _check_unique_email(value, self.instance and self.instance.pk) if value else None

    def validate_phone(self, value):
        return _check_unique_phone(value, self.instance and self.instance.pk) if value else None


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])
    email = serializers.EmailField(validators=[])  # уникальность проверяем сами → 409 email_taken
    phone = serializers.CharField(validators=[])

    class Meta:
        model = User
        fields = ["first_name", "last_name", "email", "phone", "password"]
        extra_kwargs = {"first_name": {"required": True}, "last_name": {"required": False}}

    def validate_email(self, value):
        return _check_unique_email(value)

    def validate_phone(self, value):
        return _check_unique_phone(value)

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    # фронт шлёт email; поле login (почта или телефон) оставлено для совместимости
    email = serializers.CharField(required=False)
    login = serializers.CharField(required=False)
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        login = attrs.get("email") or attrs.get("login")
        if not login:
            raise serializers.ValidationError({"email": "Введите почту"})
        user = authenticate(self.context.get("request"), username=login, password=attrs["password"])
        if not user:
            raise ApiException(401, "invalid_credentials", "Неверная почта или пароль")
        attrs["user"] = user
        return attrs


class ChangePasswordSerializer(serializers.Serializer):
    current_password = serializers.CharField(write_only=True)
    new_password = serializers.CharField(write_only=True, validators=[validate_password])

    def validate_current_password(self, value):
        if not self.context["request"].user.check_password(value):
            raise serializers.ValidationError("Неверный текущий пароль")
        return value


def auth_payload(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "user": UserSerializer(user).data,
    }
