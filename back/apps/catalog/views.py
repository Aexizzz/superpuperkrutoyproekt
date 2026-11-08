from rest_framework import viewsets

from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer
from apps.common.permissions import IsAdminOrReadOnly


class ProductViewSet(viewsets.ModelViewSet):
    """GET /api/products?category=iPhone&q=pro — список; изменение — только админ."""

    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = Product.objects.all()
        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category=category)
        if q := params.get("q"):
            qs = qs.filter(name__icontains=q)
        return qs
