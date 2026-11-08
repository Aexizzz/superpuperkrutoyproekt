from django.contrib import admin

from apps.users.models import User


@admin.register(User)
class UserAdmin(admin.ModelAdmin):
    list_display = ["id", "first_name", "last_name", "email", "phone", "role", "bonuses"]
    list_filter = ["role"]
    search_fields = ["first_name", "last_name", "email", "phone"]
    exclude = ["password"]
