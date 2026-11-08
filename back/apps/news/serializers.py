from rest_framework import serializers

from apps.news.models import News


class NewsSectionSerializer(serializers.Serializer):
    heading = serializers.CharField()
    paragraphs = serializers.ListField(child=serializers.CharField(), default=list)


class NewsSerializer(serializers.ModelSerializer):
    gallery = serializers.ListField(child=serializers.CharField(), required=False)
    sections = NewsSectionSerializer(many=True, required=False)

    class Meta:
        model = News
        fields = ["id", "title", "category", "date", "views", "image", "gallery", "sections"]
        read_only_fields = ["id", "date", "views"]
