from rest_framework import mixins, viewsets
from rest_framework.decorators import action
from rest_framework.exceptions import PermissionDenied
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response

from apps.common.exceptions import ApiException
from apps.orders.models import Order
from apps.orders.serializers import OrderSerializer

CANCELLABLE = {Order.Status.PENDING, Order.Status.PAID}


class OrderViewSet(mixins.ListModelMixin, mixins.RetrieveModelMixin, mixins.CreateModelMixin, viewsets.GenericViewSet):
    """Заказы текущего пользователя: список, просмотр, оформление, отмена."""

    serializer_class = OrderSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        qs = Order.objects.prefetch_related("items")
        # для просмотра/отмены ищем среди всех, чтобы на чужой заказ ответить 403, а не 404
        if self.action in ("retrieve", "cancel"):
            return qs
        return qs.filter(user=self.request.user)

    def get_object(self):
        order = super().get_object()
        if order.user_id != self.request.user.pk:
            raise PermissionDenied("Это не ваш заказ")
        return order

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)

    @action(detail=True, methods=["post"])
    def cancel(self, request, pk=None):
        order = self.get_object()
        if order.status not in CANCELLABLE:
            raise ApiException(409, "conflict", "Заказ уже нельзя отменить")
        order.status = Order.Status.CANCELLED
        order.save(update_fields=["status"])
        return Response(self.get_serializer(order).data)
