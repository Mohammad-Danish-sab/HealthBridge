import pytest
from sqlalchemy import select

from app.api.deps import hash_password
from app.models.user import User, UserRole


@pytest.mark.asyncio
async def test_registration_allows_local_vite_origin(client):
    response = await client.options(
        "/api/v1/auth/register",
        headers={
            "Origin": "http://localhost:5173",
            "Access-Control-Request-Method": "POST",
            "Access-Control-Request-Headers": "content-type",
        },
    )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


@pytest.mark.asyncio
async def test_public_registration_cannot_create_admin(client, db_session):
    response = await client.post("/api/v1/auth/register", json={
        "email": "untrusted-admin@test.com",
        "password": "Password123!",
        "full_name": "Untrusted Admin",
        "role": "ADMIN",
    })

    assert response.status_code == 403
    assert await db_session.scalar(
        select(User).where(User.email == "untrusted-admin@test.com")
    ) is None


@pytest.mark.asyncio
async def test_core_healthcare_workflow(client, db_session):
    # 1. Register Patient, Doctor, and Admin
    patient_res = await client.post("/api/v1/auth/register", json={
        "email": "patient@test.com",
        "password": "Password123!",
        "full_name": "John Doe",
        "role": "PATIENT"
    })
    assert patient_res.status_code == 201
    patient_id = patient_res.json()["id"]

    doctor_res = await client.post("/api/v1/auth/register", json={
        "email": "doctor@test.com",
        "password": "Password123!",
        "full_name": "Dr. Jane Smith",
        "role": "DOCTOR"
    })
    assert doctor_res.status_code == 201
    doctor_user_id = doctor_res.json()["id"]

    db_session.add(User(
        email="admin@test.com",
        hashed_password=hash_password("Password123!"),
        full_name="System Admin",
        role=UserRole.ADMIN,
    ))
    await db_session.commit()

    # 2. Authenticate all three roles
    p_token = (await client.post("/api/v1/auth/login", data={"username": "patient@test.com", "password": "Password123!"})).json()["access_token"]
    d_token = (await client.post("/api/v1/auth/login", data={"username": "doctor@test.com", "password": "Password123!"})).json()["access_token"]
    a_token = (await client.post("/api/v1/auth/login", data={"username": "admin@test.com", "password": "Password123!"})).json()["access_token"]

    p_headers = {"Authorization": f"Bearer {p_token}"}
    d_headers = {"Authorization": f"Bearer {d_token}"}
    a_headers = {"Authorization": f"Bearer {a_token}"}

    # 3. Doctor creates profile
    profile_res = await client.post("/api/v1/doctors/profile", headers=d_headers, json={
        "specialization": "Cardiology",
        "qualifications": "MD, FACC",
        "experience_years": 10,
        "consultation_fee": 150.0
    })
    assert profile_res.status_code == 201
    doctor_profile_id = profile_res.json()["id"]

    # Admins cannot use doctor self-service endpoints.
    assert (await client.get("/api/v1/doctors/me", headers=a_headers)).status_code == 403
    assert (await client.put(
        "/api/v1/doctors/me/availability",
        headers=a_headers,
        json=[],
    )).status_code == 403

    # 4. RBAC Check: Patient cannot verify a doctor
    forbidden_verify = await client.patch(f"/api/v1/doctors/{doctor_profile_id}/verify", headers=p_headers)
    assert forbidden_verify.status_code == 403

    # 5. Admin verifies doctor
    verify_res = await client.patch(f"/api/v1/doctors/{doctor_profile_id}/verify", headers=a_headers)
    assert verify_res.status_code == 200
    assert verify_res.json()["is_verified"] is True

    # 6. Patient books appointment
    booking_payload = {
        "doctor_id": doctor_profile_id,
        "appointment_date": "2026-12-01",
        "start_time": "10:00:00",
        "end_time": "10:30:00",
        "reason": "Routine cardiac checkup"
    }
    appt_res = await client.post("/api/v1/appointments/book", headers=p_headers, json=booking_payload)
    assert appt_res.status_code == 201
    appointment_id = appt_res.json()["id"]

    # 7. Double-booking prevention check
    duplicate_appt = await client.post("/api/v1/appointments/book", headers=p_headers, json=booking_payload)
    assert duplicate_appt.status_code == 400

    # 8. Doctor accepts appointment and issues digital prescription
    accept_res = await client.patch(f"/api/v1/appointments/{appointment_id}/status", headers=d_headers, json={"status": "CONFIRMED"})
    assert accept_res.status_code == 200

    rx_res = await client.post("/api/v1/records/prescriptions", headers=d_headers, json={
        "appointment_id": appointment_id,
        "diagnosis": "Mild Hypertension",
        "notes": "Monitor blood pressure daily",
        "items": [
            {
                "medicine_name": "Lisinopril",
                "dosage": "10mg",
                "frequency": "Once daily",
                "duration": "30 days",
                "instructions": "Take in the morning"
            }
        ]
    })
    assert rx_res.status_code == 201

    # 9. Patient views prescription & RBAC blocks other patients
    patient_rx_res = await client.get(f"/api/v1/records/prescriptions/patient/{patient_id}", headers=p_headers)
    assert patient_rx_res.status_code == 200
    assert len(patient_rx_res.json()) == 1

    chat_res = await client.post(
        "/api/v1/communication/chat/send",
        headers=p_headers,
        json={
            "recipient_id": doctor_user_id,
            "appointment_id": appointment_id,
            "content": "Hello doctor, please review my prescription.",
        },
    )
    assert chat_res.status_code == 200
    assert chat_res.json()["recipient_id"] == doctor_user_id

    history_res = await client.get(
        f"/api/v1/communication/chat/history/{doctor_user_id}",
        headers=p_headers,
    )
    assert history_res.status_code == 200
    assert len(history_res.json()) == 1

    doctor_notifications = await client.get(
        "/api/v1/communication/notifications",
        headers=d_headers,
    )
    chat_notification = next(
        item
        for item in doctor_notifications.json()
        if item["title"] == "New message"
    )
    forbidden_read = await client.patch(
        f"/api/v1/communication/notifications/{chat_notification['id']}/read",
        headers=p_headers,
    )
    assert forbidden_read.status_code == 404

    unrelated_res = await client.post("/api/v1/auth/register", json={
        "email": "unrelated@test.com",
        "password": "Password123!",
        "full_name": "Unrelated Patient",
        "role": "PATIENT",
    })
    assert unrelated_res.status_code == 201
    unrelated_token = (
        await client.post(
            "/api/v1/auth/login",
            data={
                "username": "unrelated@test.com",
                "password": "Password123!",
            },
        )
    ).json()["access_token"]
    unrelated_headers = {"Authorization": f"Bearer {unrelated_token}"}
    forbidden_history = await client.get(
        f"/api/v1/communication/chat/history/{doctor_user_id}",
        headers=unrelated_headers,
    )
    assert forbidden_history.status_code == 404
    forbidden_message = await client.post(
        "/api/v1/communication/chat/send",
        headers=unrelated_headers,
        json={
            "recipient_id": doctor_user_id,
            "appointment_id": appointment_id,
            "content": "This should not be delivered.",
        },
    )
    assert forbidden_message.status_code == 403

    unrelated_history = await client.post(
        f"/api/v1/ai/history/summarize/{patient_id}",
        headers=unrelated_headers,
    )
    assert unrelated_history.status_code == 403

    forbidden_ai_history = await client.post(
        f"/api/v1/ai/history/summarize/{unrelated_res.json()['id']}",
        headers=d_headers,
    )
    assert forbidden_ai_history.status_code == 403

    admin_ai_history = await client.post(
        f"/api/v1/ai/history/summarize/{patient_id}",
        headers=a_headers,
    )
    assert admin_ai_history.status_code == 403

    forbidden_ai_prescription = await client.post(
        "/api/v1/ai/prescription/explain",
        headers=unrelated_headers,
        json={"prescription_id": rx_res.json()["id"]},
    )
    assert forbidden_ai_prescription.status_code == 403

    other_doctor_res = await client.post("/api/v1/auth/register", json={
        "email": "other-doctor@test.com",
        "password": "Password123!",
        "full_name": "Dr. Other",
        "role": "DOCTOR",
    })
    assert other_doctor_res.status_code == 201
    other_doctor_token = (
        await client.post(
            "/api/v1/auth/login",
            data={
                "username": "other-doctor@test.com",
                "password": "Password123!",
            },
        )
    ).json()["access_token"]
    other_doctor_headers = {
        "Authorization": f"Bearer {other_doctor_token}"
    }
    other_doctor_profile = await client.post(
        "/api/v1/doctors/profile",
        headers=other_doctor_headers,
        json={
            "specialization": "Neurology",
            "qualifications": "MD",
            "experience_years": 5,
            "consultation_fee": 100.0,
        },
    )
    assert other_doctor_profile.status_code == 201

    forbidden_records = await client.get(
        f"/api/v1/records/prescriptions/patient/{patient_id}",
        headers=other_doctor_headers,
    )
    assert forbidden_records.status_code == 403