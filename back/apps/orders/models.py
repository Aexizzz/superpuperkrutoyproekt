from django.conf import settings
from django.db import models


class Order(models.Model):
    class Status(models.TextChoices):
        CREATED = "Оформлен"
        PAID = "Оплачен"
        SHIPPED = "Доставляется"
        DELIVERED = "Доставлен"
        CANCELLED = "Отменён"

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE, related_name="orders")
    status = models.CharField("Статус", max_length=20, choices=Status.choices, default=Status.CREATED)
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
