from django.contrib import admin

from apps.news.models import News


@admin.register(News)
class NewsAdmin(admin.ModelAdmin):
    list_display = ["id", "title", "category", "published_at", "views"]
    list_filter = ["category"]
    search_fields = ["title"]
