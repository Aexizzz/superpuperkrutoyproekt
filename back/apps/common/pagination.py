from rest_framework.pagination import LimitOffsetPagination
from rest_framework.response import Response


class ItemsPagination(LimitOffsetPagination):
    """?limit=&offset= → {"items", "total", "limit", "offset"} — как ждёт фронт."""

    default_limit = 20
    max_limit = 200

    def get_paginated_response(self, data):
        return Response({"items": data, "total": self.count, "limit": self.limit, "offset": self.offset})
