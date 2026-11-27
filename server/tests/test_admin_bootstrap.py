import pytest
from sqlalchemy import select

from app.bootstrap_admin import create_initial_admin
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_bootstrap_creates_one_admin_with_normalized_email(db_session):
    admin = await create_initial_admin(
        db_session,
        email="  ADMIN@HEALTHBRIDGE.TEST ",
        password="a-unique-long-admin-passphrase",
        full_name="  HealthBridge Admin  ",
    )

    assert admin.email == "admin@healthbridge.test"
    assert admin.full_name == "HealthBridge Admin"
    assert admin.role is UserRole.ADMIN
    assert admin.hashed_password != "a-unique-long-admin-passphrase"
    assert await db_session.scalar(
        select(User.id).where(User.role == UserRole.ADMIN)
    ) == admin.id


@pytest.mark.asyncio
async def test_bootstrap_refuses_when_admin_already_exists(db_session):
    db_session.add(
        User(
            email="existing-admin@test.com",
            hashed_password="hash",
            full_name="Existing Admin",
            role=UserRole.ADMIN,
        )
    )
    await db_session.commit()

    with pytest.raises(ValueError, match="one-time only"):
        await create_initial_admin(
            db_session,
            email="another-admin@test.com",
            password="another-unique-admin-passphrase",
            full_name="Second Admin",
        )


@pytest.mark.asyncio
async def test_bootstrap_rejects_weak_password(db_session):
    with pytest.raises(ValueError, match="at least 16 characters"):
        await create_initial_admin(
            db_session,
            email="admin@test.com",
            password="ADMIN",
            full_name="Admin",
        )
