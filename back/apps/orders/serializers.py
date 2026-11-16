from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Product
from apps.common.exceptions import ApiException
from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(
        source="product",
        queryset=Product.objects.all(),
        error_messages={"does_not_exist": "Товар #{pk_value} не найден"},
    )
    quantity = serializers.IntegerField(min_value=1, max_value=99, default=1)

    class Meta:
        model = OrderItem
        fields = ["product_id", "name", "image", "price", "quantity"]
        read_only_fields = ["name", "image", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)
    payment_method = serializers.ChoiceField(choices=Order.PaymentMethod.choices, default=Order.PaymentMethod.CARD)
    payment_token = serializers.CharField(write_only=True, required=False, allow_blank=True)
    comment = serializers.CharField(required=False, allow_blank=True)

    class Meta:
        model = Order
        fields = ["id", "status", "total", "created_at", "items", "payment_method", "payment_token", "comment"]
        read_only_fields = ["id", "status", "total", "created_at"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Корзина пуста")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        validated_data.pop("payment_token", None)

        # Цены и наличие — только из БД, клиентским суммам не доверяем.
        merged: dict[int, dict] = {}
        for item in items:
            product: Product = item["product"]
            row = merged.setdefault(product.pk, {"product": product, "quantity": 0})
            row["quantity"] += item.get("quantity", 1)

        missing = [r["product"].name for r in merged.values() if not r["product"].in_stock]
        if missing:
            raise ApiException(409, "stock_changed", f"Нет в наличии: {', '.join(missing)}")

        order = Order.objects.create(**validated_data)
        rows = [
            OrderItem(
                order=order,
                product=r["product"],
                name=r["product"].name,
                image=r["product"].image,
                price=r["product"].price,
                quantity=r["quantity"],
            )
            for r in merged.values()
        ]
        OrderItem.objects.bulk_create(rows)
        order.total = sum(r.price * r.quantity for r in rows)
        # TODO(оплата): списать деньги у провайдера по payment_token, сохранить provider_payment_id
        # и перевести заказ в status=paid. Пока заказ остаётся в pending.
        order.save(update_fields=["total"])
        return order
