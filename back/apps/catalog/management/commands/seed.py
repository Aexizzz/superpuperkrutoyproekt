from django.core.management.base import BaseCommand


class Command(BaseCommand):
    help = "Заполнение базы тестовыми данными"

    def handle(self, *args, **options):
        pass
