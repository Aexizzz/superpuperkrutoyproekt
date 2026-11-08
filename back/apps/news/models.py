from django.db import models
from django.utils import timezone


class News(models.Model):
    class Category(models.TextChoices):
        INSTRUCTIONS = "Инструкции"
        REVIEWS = "Обзоры"
        TIPS = "Советы"
        COLLECTIONS = "Подборки"

    title = models.CharField("Заголовок", max_length=500)
    category = models.CharField("Рубрика", max_length=20, choices=Category.choices, db_index=True)
    date = models.DateField("Дата", default=timezone.localdate)
    views = models.PositiveIntegerField("Просмотры", default=0)
    image = models.CharField("Обложка", max_length=500, blank=True, null=True)
    # gallery = ["/images/..."], sections = [{"heading": "...", "paragraphs": ["..."]}]
    gallery = models.JSONField("Галерея", default=list, blank=True)
    sections = models.JSONField("Разделы", default=list, blank=True)

    class Meta:
        ordering = ["-date", "-id"]
        verbose_name = "новость"
        verbose_name_plural = "новости"

    def __str__(self):
        return self.title
