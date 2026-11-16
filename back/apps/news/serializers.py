from rest_framework import serializers

from apps.news.models import News


class NewsSectionSerializer(serializers.Serializer):
    heading = serializers.CharField()
    paragraphs = serializers.ListField(child=serializers.CharField(), default=list)


class NewsSerializer(serializers.ModelSerializer):
    gallery = serializers.ListField(child=serializers.CharField(), required=False, allow_null=True)

    def validate_gallery(self, value):
        return value or []
    sections = NewsSectionSerializer(many=True, required=False)

    class Meta:
        model = News
        fields = ["id", "title", "category", "published_at", "views", "image", "gallery", "sections"]
        read_only_fields = ["id", "views"]
        extra_kwargs = {"published_at": {"required": False}}
