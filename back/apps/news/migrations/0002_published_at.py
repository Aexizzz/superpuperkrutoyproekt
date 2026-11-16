import datetime

from django.db import migrations, models
from django.utils import timezone


def copy_dates(apps, schema_editor):
    News = apps.get_model("news", "News")
    for item in News.objects.all():
        if item.date:
            item.published_at = timezone.make_aware(datetime.datetime.combine(item.date, datetime.time(9, 0)))
            item.save(update_fields=["published_at"])


class Migration(migrations.Migration):
    dependencies = [("news", "0001_initial")]

    operations = [
        migrations.AddField(
            model_name="news",
            name="published_at",
            field=models.DateTimeField(db_index=True, default=timezone.now, verbose_name="Опубликовано"),
        ),
        migrations.RunPython(copy_dates, migrations.RunPython.noop),
        migrations.RemoveField(model_name="news", name="date"),
        migrations.AlterModelOptions(
            name="news",
            options={"ordering": ["-published_at", "-id"], "verbose_name": "новость", "verbose_name_plural": "новости"},
        ),
    ]
