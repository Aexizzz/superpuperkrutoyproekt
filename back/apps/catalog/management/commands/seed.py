"""Тестовые данные для разработки: python manage.py seed"""

from django.core.management.base import BaseCommand

from apps.catalog.models import Product
from apps.news.models import News
from apps.users.models import User

ADMIN_EMAIL = "admin@nuvio.ru"
ADMIN_PASSWORD = "admin123"  # только для локальной разработки

C = Product.Category
PRODUCTS = [
    ("iPhone 18 Pro", C.IPHONE, 100990, "/images/iphone-18-pro-black.png", "Buy from $1199 or $49.95 for 24 mo."),
    ("iPhone Duo", C.IPHONE, 180000, "/images/iphone-duo.png", "Складной iPhone"),
    ("iPhone Air", C.IPHONE, 110000, "/images/iphone-air-white.png", "Самый тонкий iPhone"),
    ("iPhone 17", C.IPHONE, 80000, "/images/iphone-17.png", "Новое поколение"),
    ("MacBook Pro 16", C.MACBOOK, 299990, "/images/macbook-pro.png", "Чип M6 Pro"),
    ("MacBook Air", C.MACBOOK, 119990, "/images/macbook-air.png", "Лёгкий и мощный"),
    ("iMac", C.IMAC, 189990, "/images/imac.png", "Новый чип для ИИ"),
    ("AirPods 6", C.AIRPODS, 25000, "/images/airpods-6.png", "Активное шумоподавление"),
    ("AirPods Pro", C.AIRPODS, 24990, "/images/airpods-pro.png", "Магия шумоподавления"),
    ("Apple Watch Ultra", C.APPLE_WATCH, 79990, "/images/watch-ultra.png", "Для самых смелых"),
]


N = News.Category
NEWS = [
    (
        "Обзор Google FitBit Air",
        N.REVIEWS,
        "/images/news-fitbit.jpg",
        ["/images/news-fitbit-2.jpg", "/images/news-fitbit-3.jpg", "/images/news-fitbit-4.jpg"],
        [
            {"heading": "Не умные часы", "paragraphs": ["Тестовая статья для разработки.", "Замените её в админке."]},
        ],
    ),
    (
        "Как выбрать iMac под свои задачи",
        N.TIPS,
        "/images/news-imac.jpg",
        [],
        [{"heading": "Коротко", "paragraphs": ["Тестовая статья для разработки."]}],
    ),
    (
        "Главное с осенней презентации",
        N.COLLECTIONS,
        "/images/news-event.jpg",
        [],
        [{"heading": "Коротко", "paragraphs": ["Тестовая статья для разработки."]}],
    ),
]


class Command(BaseCommand):
    help = "Создаёт администратора, тестовые товары и новости"

    def handle(self, *args, **options):
        if not User.objects.filter(email=ADMIN_EMAIL).exists():
            User.objects.create_superuser(ADMIN_EMAIL, ADMIN_PASSWORD, first_name="Администратор")
        if not Product.objects.exists():
            Product.objects.bulk_create(
                Product(name=n, category=c, price=p, image=i, description=d) for n, c, p, i, d in PRODUCTS
            )
        if not News.objects.exists():
            for title, category, image, gallery, sections in NEWS:
                News.objects.create(title=title, category=category, image=image, gallery=gallery, sections=sections)
        self.stdout.write(self.style.SUCCESS("Seed done"))
