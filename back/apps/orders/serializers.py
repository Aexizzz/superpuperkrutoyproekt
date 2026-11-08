from django.db import transaction
from rest_framework import serializers

from apps.catalog.models import Product
from apps.orders.models import Order, OrderItem


class OrderItemSerializer(serializers.ModelSerializer):
    product_id = serializers.PrimaryKeyRelatedField(source="product", queryset=Product.objects.all())

    class Meta:
        model = OrderItem
        fields = ["product_id", "name", "image", "price", "quantity"]
        read_only_fields = ["name", "image", "price"]


class OrderSerializer(serializers.ModelSerializer):
    items = OrderItemSerializer(many=True)

    class Meta:
        model = Order
        fields = ["id", "status", "total", "created_at", "items"]
        read_only_fields = ["id", "status", "total", "created_at"]

    def validate_items(self, items):
        if not items:
            raise serializers.ValidationError("Заказ не может быть пустым")
        if any(item.get("product") is None for item in items):
            raise serializers.ValidationError("У каждой позиции должен быть товар")
        return items

    @transaction.atomic
    def create(self, validated_data):
        items = validated_data.pop("items")
        order = Order.objects.create(**validated_data)
        rows = []
        for item in items:
            product: Product = item["product"]
            rows.append(
                OrderItem(
                    order=order,
                    product=product,
                    name=product.name,
                    image=product.image,
                    price=product.price,
                    quantity=item.get("quantity", 1),
                )
            )
        OrderItem.objects.bulk_create(rows)
        order.total = sum(r.price * r.quantity for r in rows)
        # Оплата пока не реализована — здесь будет интеграция с платёжным провайдером.
        order.save(update_fields=["total"])
        return order
