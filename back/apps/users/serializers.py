from django.contrib.auth import authenticate
from django.contrib.auth.password_validation import validate_password
from rest_framework import serializers
from rest_framework_simplejwt.tokens import RefreshToken

from apps.users.models import User


class UserSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ["id", "first_name", "last_name", "email", "phone", "role", "bonuses"]
        read_only_fields = ["id", "role", "bonuses"]


class RegisterSerializer(serializers.ModelSerializer):
    password = serializers.CharField(write_only=True, validators=[validate_password])

    class Meta:
        model = User
        fields = ["first_name", "last_name", "phone", "password"]
        extra_kwargs = {"phone": {"required": True, "allow_null": False}}

    def create(self, validated_data):
        return User.objects.create_user(**validated_data)


class LoginSerializer(serializers.Serializer):
    login = serializers.CharField()  # почта или телефон
    password = serializers.CharField(write_only=True)

    def validate(self, attrs):
        user = authenticate(self.context.get("request"), username=attrs["login"], password=attrs["password"])
        if not user:
            raise serializers.ValidationError("Неверный логин или пароль")
        attrs["user"] = user
        return attrs


def auth_payload(user: User) -> dict:
    refresh = RefreshToken.for_user(user)
    return {
        "access_token": str(refresh.access_token),
        "refresh_token": str(refresh),
        "user": UserSerializer(user).data,
    }
