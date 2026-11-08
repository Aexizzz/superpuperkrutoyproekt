from django.db import models


class Product(models.Model):
    class Category(models.TextChoices):
        IPHONE = "iPhone"
        MACBOOK = "MacBook"
        IMAC = "iMac"
        AIRPODS = "AirPods"
        APPLE_WATCH = "Apple Watch"

    name = models.CharField("Название", max_length=200, db_index=True)
    category = models.CharField("Категория", max_length=20, choices=Category.choices, db_index=True)
    price = models.PositiveIntegerField("Цена, ₽")
    image = models.CharField("Картинка", max_length=500, blank=True, null=True)  # путь вида /images/...
    description = models.TextField("Описание", blank=True, default="")
    detail = models.TextField("Подробности", blank=True, null=True)

    class Meta:
        ordering = ["id"]
        verbose_name = "товар"
        verbose_name_plural = "товары"

    def __str__(self):
        return self.name
