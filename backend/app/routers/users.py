"""User management router for admins to manage customers and employees."""

from typing import Optional, List
from uuid import UUID
from enum import Enum as PyEnum
import math

from fastapi import APIRouter, Depends, HTTPException, status, Query, Request
from sqlalchemy.orm import Session
from pydantic import BaseModel

from app.database import get_db
from app.models import Customer, Employee, AuditLog
from app.models.employee import EmployeeRole
from app.utils.deps import require_admin

router = APIRouter(prefix="/users", tags=["User Management"])


# Response schemas for user management
class UserType(str, PyEnum):
    CUSTOMER = "customer"
    EMPLOYEE = "employee"


class CombinedUserResponse(BaseModel):
    """Combined response for listing both customers and employees."""
    id: UUID
    email: str
    full_name: str
    user_type: UserType
    role: Optional[str] = None  # Only for employees
    is_active: bool

    class Config:
        from_attributes = True


class EmployeeRoleUpdate(BaseModel):
    role: EmployeeRole


class UserStatusUpdate(BaseModel):
    is_active: bool


def get_client_ip(request: Request) -> str:
    """Get client IP address from request."""
    forwarded = request.headers.get("X-Forwarded-For")
    if forwarded:
        return forwarded.split(",")[0].strip()
    return request.client.host if request.client else "unknown"


@router.get("", response_model=dict)
async def list_users(
    user_type: Optional[UserType] = Query(None, description="Filter by user type"),
    role: Optional[EmployeeRole] = Query(None, description="Filter by employee role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all users (customers and employees). Admin only."""
    users = []

    # Query customers if not filtering for employees only
    if user_type is None or user_type == UserType.CUSTOMER:
        customer_query = db.query(Customer)

        if is_active is not None:
            customer_query = customer_query.filter(Customer.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            customer_query = customer_query.filter(
                (Customer.full_name.ilike(search_term)) |
                (Customer.email.ilike(search_term))
            )

        # Don't include customers if filtering by employee role
        if role is None:
            customers = customer_query.all()
            for c in customers:
                users.append(CombinedUserResponse(
                    id=c.id,
                    email=c.email,
                    full_name=c.full_name,
                    user_type=UserType.CUSTOMER,
                    role=None,
                    is_active=c.is_active
                ))

    # Query employees if not filtering for customers only
    if user_type is None or user_type == UserType.EMPLOYEE:
        employee_query = db.query(Employee)

        if role:
            employee_query = employee_query.filter(Employee.role == role)
        if is_active is not None:
            employee_query = employee_query.filter(Employee.is_active == is_active)
        if search:
            search_term = f"%{search}%"
            employee_query = employee_query.filter(
                (Employee.full_name.ilike(search_term)) |
                (Employee.email.ilike(search_term))
            )

        employees = employee_query.all()
        for e in employees:
            users.append(CombinedUserResponse(
                id=e.id,
                email=e.email,
                full_name=e.full_name,
                user_type=UserType.EMPLOYEE,
                role=e.role.value,
                is_active=e.is_active
            ))

    # Sort by email
    users.sort(key=lambda u: u.email.lower())

    # Get total count before pagination
    total = len(users)

    # Apply pagination
    offset = (page - 1) * page_size
    paginated_users = users[offset:offset + page_size]

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": [u.model_dump() for u in paginated_users],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/customers", response_model=dict)
async def list_customers(
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all customers. Admin only."""
    query = db.query(Customer)

    if is_active is not None:
        query = query.filter(Customer.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Customer.full_name.ilike(search_term)) |
            (Customer.email.ilike(search_term))
        )

    total = query.count()

    offset = (page - 1) * page_size
    customers = query.order_by(Customer.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": [{
            "id": str(c.id),
            "email": c.email,
            "full_name": c.full_name,
            "phone_number": c.phone_number,
            "address": c.address,
            "is_active": c.is_active,
            "created_at": c.created_at.isoformat() if c.created_at else None,
            "updated_at": c.updated_at.isoformat() if c.updated_at else None
        } for c in customers],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/employees", response_model=dict)
async def list_employees(
    role: Optional[EmployeeRole] = Query(None, description="Filter by role"),
    is_active: Optional[bool] = Query(None, description="Filter by active status"),
    search: Optional[str] = Query(None, description="Search by name or email"),
    page: int = Query(1, ge=1, description="Page number"),
    page_size: int = Query(20, ge=1, le=100, description="Items per page"),
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """List all employees. Admin only."""
    query = db.query(Employee)

    if role:
        query = query.filter(Employee.role == role)
    if is_active is not None:
        query = query.filter(Employee.is_active == is_active)
    if search:
        search_term = f"%{search}%"
        query = query.filter(
            (Employee.full_name.ilike(search_term)) |
            (Employee.email.ilike(search_term))
        )

    total = query.count()

    offset = (page - 1) * page_size
    employees = query.order_by(Employee.created_at.desc()).offset(offset).limit(page_size).all()

    total_pages = math.ceil(total / page_size) if total > 0 else 1

    return {
        "items": [{
            "id": str(e.id),
            "email": e.email,
            "full_name": e.full_name,
            "role": e.role.value,
            "is_active": e.is_active,
            "created_at": e.created_at.isoformat() if e.created_at else None,
            "updated_at": e.updated_at.isoformat() if e.updated_at else None
        } for e in employees],
        "total": total,
        "page": page,
        "page_size": page_size,
        "total_pages": total_pages
    }


@router.get("/customer/{customer_id}")
async def get_customer(
    customer_id: UUID,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a single customer by ID. Admin only."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    return {
        "id": str(customer.id),
        "email": customer.email,
        "full_name": customer.full_name,
        "phone_number": customer.phone_number,
        "address": customer.address,
        "is_active": customer.is_active,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "updated_at": customer.updated_at.isoformat() if customer.updated_at else None
    }


@router.get("/employee/{employee_id}")
async def get_employee(
    employee_id: UUID,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Get a single employee by ID. Admin only."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    return {
        "id": str(employee.id),
        "email": employee.email,
        "full_name": employee.full_name,
        "role": employee.role.value,
        "is_active": employee.is_active,
        "created_at": employee.created_at.isoformat() if employee.created_at else None,
        "updated_at": employee.updated_at.isoformat() if employee.updated_at else None
    }


@router.put("/employee/{employee_id}/role")
async def update_employee_role(
    employee_id: UUID,
    role_update: EmployeeRoleUpdate,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Update an employee's role. Admin only."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # Prevent admin from changing their own role
    if employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot change your own role"
        )

    old_role = employee.role
    employee.role = role_update.role

    # Create audit log
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="employee_role_updated",
        entity_type="employee",
        entity_id=str(employee.id),
        details={"old_role": old_role.value, "new_role": role_update.role.value},
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(employee)

    return {
        "id": str(employee.id),
        "email": employee.email,
        "full_name": employee.full_name,
        "role": employee.role.value,
        "is_active": employee.is_active,
        "created_at": employee.created_at.isoformat() if employee.created_at else None,
        "updated_at": employee.updated_at.isoformat() if employee.updated_at else None
    }


@router.put("/customer/{customer_id}/status")
async def update_customer_status(
    customer_id: UUID,
    status_update: UserStatusUpdate,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate a customer. Admin only."""
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    old_status = customer.is_active
    customer.is_active = status_update.is_active

    # Create audit log
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="customer_status_updated",
        entity_type="customer",
        entity_id=str(customer.id),
        details={
            "old_status": "active" if old_status else "inactive",
            "new_status": "active" if status_update.is_active else "inactive"
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(customer)

    return {
        "id": str(customer.id),
        "email": customer.email,
        "full_name": customer.full_name,
        "phone_number": customer.phone_number,
        "address": customer.address,
        "is_active": customer.is_active,
        "created_at": customer.created_at.isoformat() if customer.created_at else None,
        "updated_at": customer.updated_at.isoformat() if customer.updated_at else None
    }


@router.put("/employee/{employee_id}/status")
async def update_employee_status(
    employee_id: UUID,
    status_update: UserStatusUpdate,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Activate or deactivate an employee. Admin only."""
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # Prevent admin from deactivating themselves
    if employee.id == current_user.id and not status_update.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot deactivate your own account"
        )

    old_status = employee.is_active
    employee.is_active = status_update.is_active

    # Create audit log
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="employee_status_updated",
        entity_type="employee",
        entity_id=str(employee.id),
        details={
            "old_status": "active" if old_status else "inactive",
            "new_status": "active" if status_update.is_active else "inactive"
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(employee)

    return {
        "id": str(employee.id),
        "email": employee.email,
        "full_name": employee.full_name,
        "role": employee.role.value,
        "is_active": employee.is_active,
        "created_at": employee.created_at.isoformat() if employee.created_at else None,
        "updated_at": employee.updated_at.isoformat() if employee.updated_at else None
    }


# ========== DELETE ENDPOINTS ==========

@router.delete("/customer/{customer_id}")
async def delete_customer(
    customer_id: UUID,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete a customer. Admin only.

    Note: This is a hard delete. For soft delete, use the status endpoint.
    """
    customer = db.query(Customer).filter(Customer.id == customer_id).first()

    if not customer:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Customer not found"
        )

    customer_email = customer.email
    customer_name = customer.full_name

    # Create audit log before deletion
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="customer_deleted",
        entity_type="customer",
        entity_id=str(customer_id),
        details={
            "deleted_email": customer_email,
            "deleted_name": customer_name
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    # Delete the customer
    db.delete(customer)
    db.commit()

    return {
        "message": f"Customer '{customer_name}' deleted successfully",
        "deleted_id": str(customer_id)
    }


@router.delete("/employee/{employee_id}")
async def delete_employee(
    employee_id: UUID,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Delete an employee. Admin only.

    Note: Cannot delete yourself.
    """
    employee = db.query(Employee).filter(Employee.id == employee_id).first()

    if not employee:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Employee not found"
        )

    # Prevent admin from deleting themselves
    if employee.id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete your own account"
        )

    employee_email = employee.email
    employee_name = employee.full_name
    employee_role = employee.role.value

    # Create audit log before deletion
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="employee_deleted",
        entity_type="employee",
        entity_id=str(employee_id),
        details={
            "deleted_email": employee_email,
            "deleted_name": employee_name,
            "deleted_role": employee_role
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    # Delete the employee
    db.delete(employee)
    db.commit()

    return {
        "message": f"Employee '{employee_name}' deleted successfully",
        "deleted_id": str(employee_id)
    }


# ========== CREATE STAFF ENDPOINT ==========

class CreateStaffRequest(BaseModel):
    """Request schema for creating a new staff member (employee)."""
    email: str
    full_name: str
    password: str
    role: EmployeeRole


@router.post("/staff", status_code=status.HTTP_201_CREATED)
async def create_staff(
    staff_data: CreateStaffRequest,
    request: Request,
    current_user: Employee = Depends(require_admin),
    db: Session = Depends(get_db)
):
    """Create a new staff member (Manager or Auditor). Admin only.

    Business rules:
    - Email must be unique across all employees
    - Password is hashed before storage
    - Only MANAGER and AUDITOR roles can be created (not ADMIN)
    """
    from app.utils.security import get_password_hash

    # Validate role - only allow MANAGER and AUDITOR creation
    if staff_data.role == EmployeeRole.ADMIN:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot create admin accounts through this endpoint"
        )

    # Check if email already exists in employees
    existing_employee = db.query(Employee).filter(
        Employee.email == staff_data.email.lower()
    ).first()

    if existing_employee:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="An employee with this email already exists"
        )

    # Check if email exists in customers (optional, for uniqueness across system)
    existing_customer = db.query(Customer).filter(
        Customer.email == staff_data.email.lower()
    ).first()

    if existing_customer:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="This email is already registered as a customer"
        )

    # Validate password length
    if len(staff_data.password) < 6:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Password must be at least 6 characters long"
        )

    # Create the new employee
    new_employee = Employee(
        email=staff_data.email.lower().strip(),
        full_name=staff_data.full_name.strip(),
        password_hash=get_password_hash(staff_data.password),
        role=staff_data.role,
        is_active=True
    )

    db.add(new_employee)

    # Create audit log
    audit_log = AuditLog(
        employee_id=current_user.id,
        action="staff_created",
        entity_type="employee",
        details={
            "created_email": new_employee.email,
            "created_name": new_employee.full_name,
            "created_role": staff_data.role.value
        },
        ip_address=get_client_ip(request)
    )
    db.add(audit_log)

    db.commit()
    db.refresh(new_employee)

    return {
        "id": str(new_employee.id),
        "email": new_employee.email,
        "full_name": new_employee.full_name,
        "role": new_employee.role.value,
        "is_active": new_employee.is_active,
        "created_at": new_employee.created_at.isoformat() if new_employee.created_at else None,
        "message": f"{staff_data.role.value} '{new_employee.full_name}' created successfully"
    }
