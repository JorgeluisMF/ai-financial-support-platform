def split_text_into_chunks(
    text: str,
    chunk_size: int = 600,
    chunk_overlap: int = 120,
) -> list[str]:
    clean_text = " ".join(text.split())
    if not clean_text:
        return []

    if chunk_overlap >= chunk_size:
        raise ValueError("chunk_overlap must be smaller than chunk_size")

    chunks: list[str] = []
    start = 0
    step = chunk_size - chunk_overlap
    text_length = len(clean_text)

    while start < text_length:
        end = min(start + chunk_size, text_length)
        chunks.append(clean_text[start:end].strip())
        start += step

    return [chunk for chunk in chunks if chunk]
