import re
from dataclasses import dataclass

from app.core.config import settings


@dataclass
class SanitizationResult:
    cleaned_text: str
    flags: list[str]


def _normalize_whitespace(text: str) -> str:
    return " ".join(text.split())


def _truncate(text: str, max_length: int) -> tuple[str, bool]:
    if len(text) <= max_length:
        return text, False
    return text[:max_length], True


def sanitize_user_message(raw_text: str) -> SanitizationResult:
    flags: list[str] = []
    text = _normalize_whitespace(raw_text)
    text, was_truncated = _truncate(text, settings.sanitization_max_length)
    if was_truncated:
        flags.append("truncated")

    patterns = [
        pattern.strip().lower()
        for pattern in settings.sanitization_block_patterns.split(",")
        if pattern.strip()
    ]
    lowered = text.lower()
    for pattern in patterns:
        if pattern in lowered:
            flags.append("pattern_masked")
            text = re.sub(
                re.escape(pattern),
                settings.sanitization_mask_replacement,
                text,
                flags=re.IGNORECASE,
            )
            lowered = text.lower()

    if not text:
        text = settings.sanitization_mask_replacement
        flags.append("empty_after_sanitization")

    return SanitizationResult(cleaned_text=text, flags=flags)
