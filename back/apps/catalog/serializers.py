from rest_framework import serializers

from apps.catalog.models import Product


class ProductSerializer(serializers.ModelSerializer):
    class Meta:
        model = Product
        fields = ["id", "name", "category", "price", "image", "description", "detail", "in_stock", "created_at"]
        read_only_fields = ["id", "created_at"]
