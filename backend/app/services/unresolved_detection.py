from typing import Any


_DEFAULT_NEGATIVE_PHRASES = (
    "i don't have enough information,"
    "insufficient information,"
    "i cannot answer,"
    "not enough context,"
    "no sufficient information,"
)


def _normalized_phrases(raw: str) -> list[str]:
    source = raw or _DEFAULT_NEGATIVE_PHRASES
    return [p.strip().lower() for p in source.split(",") if p.strip()]


def evaluate_unresolved(
    answer_text: str,
    chunks: list[dict[str, Any]],
    *,
    score_threshold: float,
    negative_phrases_csv: str,
) -> tuple[bool, str | None, float | None, int]:
    """
    Returns: (should_record, reason, top_score, chunk_count)
    reason: negative_answer | no_context | low_similarity
    """
    chunk_count = len(chunks)
    top_score: float | None = None
    if chunks:
        top_score = max(float(item["score"]) for item in chunks)

    phrases = _normalized_phrases(negative_phrases_csv)
    answer_lower = answer_text.lower()
    for phrase in phrases:
        if phrase and phrase in answer_lower:
            return True, "negative_answer", top_score, chunk_count

    if chunk_count == 0:
        return True, "no_context", None, 0

    if top_score is not None and top_score < score_threshold:
        return True, "low_similarity", top_score, chunk_count

    return False, None, top_score, chunk_count
