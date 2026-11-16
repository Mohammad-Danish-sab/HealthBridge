import pytest

@pytest.mark.asyncio
async def test_core_healthcare_workflow(client):
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

    admin_res = await client.post("/api/v1/auth/register", json={
        "email": "admin@test.com",
        "password": "Password123!",
        "full_name": "System Admin",
        "role": "ADMIN"
    })
    assert admin_res.status_code == 201

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