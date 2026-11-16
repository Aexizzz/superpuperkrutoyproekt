from rest_framework import viewsets

from apps.catalog.models import Product
from apps.catalog.serializers import ProductSerializer
from apps.common.permissions import IsAdminOrReadOnly

SORTS = {"price_asc": ["price", "id"], "price_desc": ["-price", "id"], "new": ["-created_at", "-id"]}


class ProductViewSet(viewsets.ModelViewSet):
    """GET /api/products?category=iPhone&q=pro&inStock=true&sort=price_asc&limit=20&offset=0
    Изменение — только админ."""

    serializer_class = ProductSerializer
    permission_classes = [IsAdminOrReadOnly]
    http_method_names = ["get", "post", "patch", "delete", "head", "options"]

    def get_queryset(self):
        qs = Product.objects.all()
        params = self.request.query_params
        if category := params.get("category"):
            qs = qs.filter(category=category)
        if q := params.get("q"):
            qs = qs.filter(name__icontains=q)
        in_stock = params.get("inStock") or params.get("in_stock")
        if in_stock in ("true", "1"):
            qs = qs.filter(in_stock=True)
        elif in_stock in ("false", "0"):
            qs = qs.filter(in_stock=False)
        if sort := SORTS.get(params.get("sort", "")):
            qs = qs.order_by(*sort)
        return qs
