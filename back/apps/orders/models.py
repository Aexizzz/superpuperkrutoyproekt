from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        # значения — как OrderStatus во front/src/types
        PENDING = "pending", "Ожидает оплаты"
        PAID = "paid", "Оплачен"
        SHIPPED = "shipped", "Доставляется"
        DELIVERED = "delivered", "Доставлен"
        CANCELLED = "cancelled", "Отменён"

    class PaymentMethod(models.TextChoices):
        CARD = "card", "Карта"
        APPLEPAY = "applepay", "Apple Pay"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField("Статус", max_length=20, choices=Status.choices, default=Status.PENDING)
    payment_method = models.CharField("Способ оплаты", max_length=20, choices=PaymentMethod.choices, default=PaymentMethod.CARD)
    provider_payment_id = models.CharField("ID платежа у провайдера", max_length=200, blank=True, default="")
    comment = models.TextField("Комментарий", blank=True, default="")
    total = models.PositiveIntegerField("Сумма, ₽", default=0)
    created_at = models.DateTimeField("Создан", auto_now_add=True)

    class Meta:
        ordering = ["-created_at", "-id"]
        verbose_name = "заказ"
        verbose_name_plural = "заказы"

    def __str__(self):
        return f"Заказ #{self.pk}"


class OrderItem(models.Model):
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name="items")
    product = models.ForeignKey("catalog.Product", on_delete=models.SET_NULL, null=True, related_name="+")
    # Снимок товара на момент покупки — заказ не меняется, если товар отредактируют.
    name = models.CharField(max_length=200)
    image = models.CharField(max_length=500, blank=True, null=True)
    price = models.PositiveIntegerField()
    quantity = models.PositiveIntegerField(default=1)

    class Meta:
        verbose_name = "позиция заказа"
        verbose_name_plural = "позиции заказа"
