from django.urls import path

from apps.users.views import ChangePasswordView, LoginView, LogoutView, MeView, RefreshView, RegisterView

urlpatterns = [
    path("auth/register", RegisterView.as_view(), name="register"),
    path("auth/login", LoginView.as_view(), name="login"),
    path("auth/refresh", RefreshView.as_view(), name="token-refresh"),
    path("auth/logout", LogoutView.as_view(), name="logout"),
    path("auth/me", MeView.as_view(), name="me"),
    path("auth/change-password", ChangePasswordView.as_view(), name="change-password"),
    path("users/me", MeView.as_view(), name="me-legacy"),  # старый путь
]
