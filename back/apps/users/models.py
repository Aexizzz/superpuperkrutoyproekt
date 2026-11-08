from django.contrib.auth.models import AbstractBaseUser, BaseUserManager, PermissionsMixin
from django.db import models


class UserManager(BaseUserManager):
    use_in_migrations = True

    def create_user(self, email=None, phone=None, password=None, **extra):
        if not email and not phone:
            raise ValueError("Нужна почта или телефон")
        email = self.normalize_email(email).lower() if email else None
        user = self.model(email=email, phone=phone or None, **extra)
        user.set_password(password)
        user.save(using=self._db)
        return user

    def create_superuser(self, email, password=None, **extra):
        extra.update(role=User.Role.ADMIN, is_staff=True, is_superuser=True)
        return self.create_user(email=email, password=password, **extra)


class User(AbstractBaseUser, PermissionsMixin):
    class Role(models.TextChoices):
        USER = "user", "Покупатель"
        ADMIN = "admin", "Администратор"

    first_name = models.CharField("Имя", max_length=100)
    last_name = models.CharField("Фамилия", max_length=100, blank=True, default="")
    # Вход на фронте — по почте, регистрация — по телефону: оба поля уникальны и необязательны.
    email = models.EmailField("Почта", unique=True, null=True, blank=True)
    phone = models.CharField("Телефон", max_length=32, unique=True, null=True, blank=True)
    role = models.CharField("Роль", max_length=10, choices=Role.choices, default=Role.USER)
    bonuses = models.PositiveIntegerField("Бонусы", default=0)

    is_active = models.BooleanField(default=True)
    is_staff = models.BooleanField(default=False)  # доступ в Django admin
    date_joined = models.DateTimeField(auto_now_add=True)

    objects = UserManager()

    USERNAME_FIELD = "email"
    REQUIRED_FIELDS = ["first_name"]

    class Meta:
        verbose_name = "пользователь"
        verbose_name_plural = "пользователи"

    def __str__(self):
        return self.email or self.phone or f"user #{self.pk}"
