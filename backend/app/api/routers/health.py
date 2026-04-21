from fastapi import APIRouter

router = APIRouter()


@router.get("", summary="Liveness endpoint")
async def healthcheck() -> dict[str, str]:
    return {"status": "ok"}
