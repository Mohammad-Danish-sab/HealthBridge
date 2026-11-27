import pytest

from app.api.deps import create_access_token, hash_password
from app.models.user import User, UserRole


async def create_admin(db_session):
    admin = User(
        email="admin-management@test.com",
        hashed_password=hash_password("SecureAdminPassword123!"),
        full_name="Admin Operator",
        role=UserRole.ADMIN,
    )
    db_session.add(admin)
    await db_session.commit()
    return {"Authorization": f"Bearer {create_access_token(admin.id)}"}


@pytest.mark.asyncio
async def test_admin_can_create_users_but_cannot_use_generic_route_for_doctors(
    client, db_session
):
    headers = await create_admin(db_session)

    created = await client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "email": "new-patient@test.com",
            "password": "PatientPassword123!",
            "full_name": "New Patient",
            "role": "PATIENT",
        },
    )
    assert created.status_code == 201
    assert created.json()["role"] == "PATIENT"
    assert "hashed_password" not in created.json()

    doctor_role = await client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "email": "doctor-user@test.com",
            "password": "DoctorPassword123!",
            "full_name": "Doctor User",
            "role": "DOCTOR",
        },
    )
    assert doctor_role.status_code == 422


@pytest.mark.asyncio
async def test_admin_can_create_edit_verify_and_schedule_doctor(client, db_session):
    headers = await create_admin(db_session)
    created = await client.post(
        "/api/v1/admin/doctors",
        headers=headers,
        json={
            "email": "doctor-management@test.com",
            "password": "DoctorPassword123!",
            "full_name": "Morgan Shah",
            "profile": {
                "specialization": "Cardiology",
                "license_number": "NCR-REG-1001",
                "qualifications": "MBBS, MD",
                "experience_years": 8,
                "bio": "Cardiology consultant",
                "consultation_fee": 900,
            },
        },
    )
    assert created.status_code == 201, created.text
    doctor = created.json()
    assert doctor["is_verified"] is False
    assert doctor["qualifications"] == "MBBS, MD"

    updated = await client.patch(
        f"/api/v1/admin/doctors/{doctor['id']}",
        headers=headers,
        json={"specialization": "Interventional Cardiology", "consultation_fee": 1200},
    )
    assert updated.status_code == 200
    assert updated.json()["specialization"] == "Interventional Cardiology"
    assert updated.json()["consultation_fee"] == 1200

    schedule = [
        {
            "day_of_week": "MONDAY",
            "start_time": "09:00:00",
            "end_time": "13:00:00",
            "slot_duration_minutes": 30,
        },
        {
            "day_of_week": "WEDNESDAY",
            "start_time": "14:00:00",
            "end_time": "17:00:00",
            "slot_duration_minutes": 45,
        },
    ]
    saved_schedule = await client.put(
        f"/api/v1/admin/doctors/{doctor['id']}/availability",
        headers=headers,
        json=schedule,
    )
    assert saved_schedule.status_code == 200
    assert saved_schedule.json() == schedule

    retrieved_schedule = await client.get(
        f"/api/v1/admin/doctors/{doctor['id']}/availability",
        headers=headers,
    )
    assert retrieved_schedule.status_code == 200
    assert retrieved_schedule.json() == schedule

    verified = await client.patch(
        f"/api/v1/doctors/{doctor['id']}/verify",
        headers=headers,
    )
    assert verified.status_code == 200
    assert verified.json()["is_verified"] is True

    deactivated = await client.patch(
        f"/api/v1/admin/users/{doctor['user_id']}/toggle-status",
        headers=headers,
    )
    assert deactivated.status_code == 200
    assert deactivated.json()["is_active"] is False
    search = await client.get("/api/v1/doctors/search", headers=headers)
    assert search.status_code == 200
    assert search.json() == []


@pytest.mark.asyncio
async def test_non_admin_cannot_create_users_or_change_doctor_availability(
    client, db_session
):
    patient = User(
        email="patient-management@test.com",
        hashed_password=hash_password("PatientPassword123!"),
        full_name="Patient User",
        role=UserRole.PATIENT,
    )
    db_session.add(patient)
    await db_session.commit()
    headers = {"Authorization": f"Bearer {create_access_token(patient.id)}"}

    created = await client.post(
        "/api/v1/admin/users",
        headers=headers,
        json={
            "email": "forbidden@test.com",
            "password": "PatientPassword123!",
            "full_name": "Forbidden User",
            "role": "PATIENT",
        },
    )
    assert created.status_code == 403
