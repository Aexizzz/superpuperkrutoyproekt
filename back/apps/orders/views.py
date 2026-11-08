from rest_framework import mixins, viewsets
from rest_framework.permissions import IsAuthenticated

from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Заказы текущего пользователя: список, просмотр, оформление."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return Order.objects.filter(user=self.request.user).prefetch_related("items")

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)
