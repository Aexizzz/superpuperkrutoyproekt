"""Ошибки в формате фронта: {"error": {"code", "message", "fields"}} (см. front/docs/API.md)."""

from djangorestframework_camel_case.util import camelize_re, underscore_to_camel
from rest_framework import exceptions, status
from rest_framework.response import Response
from rest_framework.views import exception_handler as drf_exception_handler


class ApiException(exceptions.APIException):
    """Ошибка с явным кодом: raise ApiException(409, "email_taken", "Почта уже занята", {"email": "..."})"""

    def __init__(self, status_code: int, code: str, message: str, fields: dict | None = None):
        super().__init__(detail=message, code=code)
        self.status_code = status_code
        self.error_code = code
        self.message = message
        self.fields = fields or {}


DEFAULT_CODES = {
    400: "validation_error",
    401: "unauthorized",
    403: "forbidden",
    404: "not_found",
    405: "method_not_allowed",
    409: "conflict",
    429: "rate_limited",
}

DEFAULT_MESSAGES = {
    400: "Проверьте правильность заполнения полей.",
    401: "Нужно войти в аккаунт.",
    403: "Недостаточно прав для этого действия.",
    404: "Не найдено.",
    429: "Слишком много попыток. Попробуйте позже.",
}


def _first(value) -> str:
    """Из DRF-ошибки ['msg', ...] или {'nested': [...]} достаём первую строку."""
    if isinstance(value, (list, tuple)):
        return _first(value[0]) if value else ""
    if isinstance(value, dict):
        return _first(next(iter(value.values()))) if value else ""
    return str(value)


def _camel(key: str) -> str:
    return camelize_re.sub(underscore_to_camel, key)


def exception_handler(exc, context):
    if isinstance(exc, ApiException):
        return Response(
            {"error": {"code": exc.error_code, "message": exc.message, "fields": exc.fields}},
            status=exc.status_code,
        )

    response = drf_exception_handler(exc, context)
    if response is None:
        return None  # 500 — отдаст Django

    status_code = response.status_code
    code = DEFAULT_CODES.get(status_code, "server_error" if status_code >= 500 else "unknown_error")
    data = response.data
    fields: dict[str, str] = {}
    message = DEFAULT_MESSAGES.get(status_code, "Что-то пошло не так.")

    if isinstance(exc, exceptions.ValidationError):
        if isinstance(data, dict):
            non_field = data.get("non_field_errors") or data.get("detail")
            for key, value in data.items():
                if key in ("non_field_errors", "detail"):
                    continue
                fields[_camel(key)] = _first(value)
            if non_field:
                message = _first(non_field)
            elif len(fields) == 1:
                message = next(iter(fields.values()))
        elif isinstance(data, list) and data:
            message = _first(data)
    elif isinstance(data, dict) and "detail" in data:
        message = str(data["detail"])

    if status_code == status.HTTP_401_UNAUTHORIZED:
        message = DEFAULT_MESSAGES[401]

    response.data = {"error": {"code": code, "message": message, "fields": fields}}
    return response
