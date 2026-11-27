import asyncio
import os

from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession, async_sessionmaker

from app.api.deps import hash_password
from app.db.session import engine
from app.models.user import User, UserRole


async def create_initial_admin(
    session: AsyncSession,
    *,
    email: str,
    password: str,
    full_name: str,
) -> User:
    normalized_email = email.strip().lower()
    normalized_name = full_name.strip()
    if "@" not in normalized_email or normalized_email.startswith("@") or normalized_email.endswith("@"):
        raise ValueError("ADMIN_BOOTSTRAP_EMAIL must be a valid email address.")
    if len(password) < 16 or password.strip().upper() in {
        "ADMIN",
        "PASSWORD",
        "CHANGE_ME",
        "REPLACE_ME",
    }:
        raise ValueError(
            "ADMIN_BOOTSTRAP_PASSWORD must be a unique password with at least 16 characters."
        )
    if not normalized_name:
        raise ValueError("ADMIN_BOOTSTRAP_FULL_NAME is required.")

    admin_exists = await session.scalar(
        select(User.id).where(User.role == UserRole.ADMIN).limit(1)
    )
    if admin_exists is not None:
        raise ValueError("An admin account already exists; bootstrap is one-time only.")

    email_exists = await session.scalar(
        select(User.id).where(User.email == normalized_email)
    )
    if email_exists is not None:
        raise ValueError("The bootstrap email already belongs to an account.")

    admin = User(
        email=normalized_email,
        hashed_password=hash_password(password),
        full_name=normalized_name,
        role=UserRole.ADMIN,
    )
    session.add(admin)
    await session.commit()
    await session.refresh(admin)
    return admin


async def main() -> None:
    required = {
        "ADMIN_BOOTSTRAP_EMAIL": os.getenv("ADMIN_BOOTSTRAP_EMAIL", ""),
        "ADMIN_BOOTSTRAP_PASSWORD": os.getenv("ADMIN_BOOTSTRAP_PASSWORD", ""),
        "ADMIN_BOOTSTRAP_FULL_NAME": os.getenv("ADMIN_BOOTSTRAP_FULL_NAME", ""),
    }
    if not all(required.values()):
        raise SystemExit(
            "Set ADMIN_BOOTSTRAP_EMAIL, ADMIN_BOOTSTRAP_PASSWORD, and "
            "ADMIN_BOOTSTRAP_FULL_NAME in the environment."
        )

    try:
        session_factory = async_sessionmaker(engine, expire_on_commit=False)
        async with session_factory() as session:
            admin = await create_initial_admin(
                session,
                email=required["ADMIN_BOOTSTRAP_EMAIL"],
                password=required["ADMIN_BOOTSTRAP_PASSWORD"],
                full_name=required["ADMIN_BOOTSTRAP_FULL_NAME"],
            )
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc
    finally:
        await engine.dispose()

    print(f"Created initial administrator account: {admin.email}")


if __name__ == "__main__":
    asyncio.run(main())
