import asyncio

from app.db.session import init_db


async def run() -> None:
    await init_db(include_migrations=True)


if __name__ == "__main__":
    asyncio.run(run())
