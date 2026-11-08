from django.contrib import admin
from django.http import JsonResponse
from django.urls import include, path
from rest_framework.routers import DefaultRouter

from apps.catalog.views import ProductViewSet
from apps.news.views import NewsViewSet
from apps.orders.views import OrderViewSet

router = DefaultRouter(trailing_slash=False)
router.register("products", ProductViewSet, basename="product")
router.register("news", NewsViewSet, basename="news")
router.register("orders", OrderViewSet, basename="order")

urlpatterns = [
    path("admin/", admin.site.urls),
    path("health", lambda request: JsonResponse({"status": "ok"})),
    path("api/", include("apps.users.urls")),
    path("api/", include(router.urls)),
]
