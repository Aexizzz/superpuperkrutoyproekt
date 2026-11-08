from django.db.models import F
from rest_framework import viewsets
from rest_framework.response import Response

from apps.common.permissions import IsAdminOrReadOnly
from apps.news.models import News
from apps.news.serializers import NewsSerializer


class NewsViewSet(viewsets.ModelViewSet):
    """GET /api/news?category=Обзоры — список; изменение — только админ."""

    serializer_class = NewsSerializer
    permission_classes = [IsAdminOrReadOnly]

    def get_queryset(self):
        qs = News.objects.all()
        if category := self.request.query_params.get("category"):
            qs = qs.filter(category=category)
        return qs

    def retrieve(self, request, *args, **kwargs):
        item = self.get_object()
        News.objects.filter(pk=item.pk).update(views=F("views") + 1)
        item.refresh_from_db(fields=["views"])
        return Response(self.get_serializer(item).data)
