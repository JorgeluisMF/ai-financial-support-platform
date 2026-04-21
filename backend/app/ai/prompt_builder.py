def build_chat_prompt(user_question: str, chunks: list[dict]) -> str:
    context_block = "\n".join(f"- {item['content']}" for item in chunks)
    return (
        "You are a customer support assistant for a financial institution.\n"
        "Answer accurately using only the retrieved context.\n"
        "If there is not enough information, say so explicitly.\n\n"
        f"Context:\n{context_block}\n\n"
        f"User question: {user_question}\n"
        "Answer:"
    )
