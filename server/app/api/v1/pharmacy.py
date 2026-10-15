from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select

from app.db.session import get_db
from app.models.user import User, UserRole
from app.models.pharmacy import Medicine, Order, OrderItem, OrderStatus
from app.schemas.pharmacy import (
    MedicineCreate,
    MedicineResponse,
    OrderCreate,
    OrderResponse,
    OrderStatusUpdate
)
from app.services.audit import log_action
from app.api.deps import get_current_user, RoleChecker

router = APIRouter(prefix="/pharmacy", tags=["Pharmacy"])

allow_admin = RoleChecker([UserRole.ADMIN])
allow_patient = RoleChecker([UserRole.PATIENT])
allow_all = RoleChecker([UserRole.PATIENT, UserRole.DOCTOR, UserRole.ADMIN])

@router.get("/medicines", response_model=List[MedicineResponse])
async def list_medicines(
    search: Optional[str] = Query(None),
    db: AsyncSession = Depends(get_db)
):
    query = select(Medicine).where(Medicine.is_active == True)
    if search:
        query = query.where(Medicine.name.ilike(f"%{search}%"))
    result = await db.execute(query)
    return result.scalars().all()

@router.post("/medicines", response_model=MedicineResponse, status_code=status.HTTP_201_CREATED)
async def add_medicine(
    med_in: MedicineCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    medicine = Medicine(**med_in.dict())
    db.add(medicine)
    await db.commit()
    await db.refresh(medicine)

    await log_action(
        db, current_user.id, "CREATE_MEDICINE", "Medicine", medicine.id, f"Added {medicine.name}"
    )
    return medicine

@router.post("/orders", response_model=OrderResponse, status_code=status.HTTP_201_CREATED)
async def place_order(
    order_in: OrderCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_patient)
):
    if not order_in.items:
        raise HTTPException(status_code=400, detail="Order items list cannot be empty.")

    total_amount = 0.0
    order_items_to_create = []

    for item in order_in.items:
        med_res = await db.execute(select(Medicine).where(Medicine.id == item.medicine_id))
        med = med_res.scalars().first()
        if not med or not med.is_active:
            raise HTTPException(status_code=404, detail=f"Medicine ID {item.medicine_id} not available.")
        if med.stock_quantity < item.quantity:
            raise HTTPException(
                status_code=400,
                detail=f"Insufficient stock for {med.name}. Available: {med.stock_quantity}"
            )

        # Deduct stock
        med.stock_quantity -= item.quantity
        line_total = med.unit_price * item.quantity
        total_amount += line_total

        order_items_to_create.append({
            "medicine_id": med.id,
            "quantity": item.quantity,
            "unit_price": med.unit_price
        })

    order = Order(
        patient_id=current_user.id,
        prescription_id=order_in.prescription_id,
        shipping_address=order_in.shipping_address,
        total_amount=total_amount,
        status=OrderStatus.PLACED
    )
    db.add(order)
    await db.flush()

    for item_data in order_items_to_create:
        db.add(OrderItem(order_id=order.id, **item_data))

    await db.commit()

    await log_action(
        db, current_user.id, "PLACE_ORDER", "Order", order.id, f"Order placed for ${total_amount}"
    )

    result = await db.execute(select(Order).where(Order.id == order.id))
    return result.scalars().first()

@router.get("/orders/my-orders", response_model=List[OrderResponse])
async def get_my_orders(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user)
):
    query = select(Order)
    if current_user.role == UserRole.PATIENT:
        query = query.where(Order.patient_id == current_user.id)
    
    query = query.order_by(Order.created_at.desc())
    result = await db.execute(query)
    return result.scalars().all()

@router.patch("/orders/{order_id}/status", response_model=OrderResponse)
async def update_order_status(
    order_id: int,
    status_in: OrderStatusUpdate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(allow_admin)
):
    result = await db.execute(select(Order).where(Order.id == order_id))
    order = result.scalars().first()
    if not order:
        raise HTTPException(status_code=404, detail="Order not found.")

    order.status = status_in.status
    await db.commit()
    await db.refresh(order)

    await log_action(
        db, current_user.id, "UPDATE_ORDER_STATUS", "Order", order.id, f"Updated to {status_in.status}"
    )
    return order