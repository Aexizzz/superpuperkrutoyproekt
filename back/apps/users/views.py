from rest_framework import generics, status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.throttling import ScopedRateThrottle
from rest_framework.views import APIView
from rest_framework_simplejwt.exceptions import TokenError
from rest_framework_simplejwt.serializers import TokenRefreshSerializer
from rest_framework_simplejwt.tokens import RefreshToken

from apps.common.exceptions import ApiException
from apps.users.serializers import (
    ChangePasswordSerializer,
    LoginSerializer,
    RegisterSerializer,
    UserSerializer,
    auth_payload,
)


class RegisterView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        user = serializer.save()
        return Response(auth_payload(user), status=status.HTTP_201_CREATED)


class LoginView(APIView):
    permission_classes = [AllowAny]
    authentication_classes = []
    throttle_classes = [ScopedRateThrottle]
    throttle_scope = "auth"

    def post(self, request):
        serializer = LoginSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        return Response(auth_payload(serializer.validated_data["user"]))


class RefreshView(APIView):
    """{ refreshToken } → { accessToken, refreshToken }. Старый refresh отзывается (ротация)."""

    permission_classes = [AllowAny]
    authentication_classes = []

    def post(self, request):
        serializer = TokenRefreshSerializer(data={"refresh": request.data.get("refresh_token", "")})
        try:
            serializer.is_valid(raise_exception=True)
        except Exception:
            raise ApiException(401, "unauthorized", "Сессия истекла, войдите снова")
        data = serializer.validated_data
        return Response({"access_token": data["access"], "refresh_token": data.get("refresh")})


class LogoutView(APIView):
    """Отзывает refresh-токен. Фронт чистит хранилище в любом случае."""

    permission_classes = [AllowAny]
    authentication_classes = []  # access-токен мог уже протухнуть — выйти всё равно можно

    def post(self, request):
        token = request.data.get("refresh_token") if isinstance(request.data, dict) else None
        if token:
            try:
                RefreshToken(token).blacklist()
            except TokenError:
                pass
        return Response(status=status.HTTP_204_NO_CONTENT)


class MeView(generics.RetrieveUpdateAPIView):
    serializer_class = UserSerializer
    permission_classes = [IsAuthenticated]
    http_method_names = ["get", "patch"]

    def get_object(self):
        return self.request.user


class ChangePasswordView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = ChangePasswordSerializer(data=request.data, context={"request": request})
        serializer.is_valid(raise_exception=True)
        request.user.set_password(serializer.validated_data["new_password"])
        request.user.save(update_fields=["password"])
        return Response(status=status.HTTP_204_NO_CONTENT)
