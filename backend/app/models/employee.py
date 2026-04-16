from sqlalchemy import Column, Integer, String, Float, Date, DateTime, Boolean, Text, Enum, ForeignKey
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
from app.core.database import Base
import enum

class EmployeeStatus(str, enum.Enum):
    active   = "active"    # Aktif
    inactive = "inactive"  # Pasif
    on_leave = "on_leave"  # İzinde

class LeaveType(str, enum.Enum):
    annual    = "annual"    # Yıllık izin
    sick      = "sick"      # Hastalık izni
    excuse    = "excuse"    # Mazeret izni
    unpaid    = "unpaid"    # Ücretsiz izin
    other     = "other"     # Diğer

class LeaveStatus(str, enum.Enum):
    pending  = "pending"   # Bekliyor
    approved = "approved"  # Onaylandı
    rejected = "rejected"  # Reddedildi

class Employee(Base):
    __tablename__ = "employees"

    id              = Column(Integer, primary_key=True, index=True)
    # Kişisel
    first_name      = Column(String, nullable=False)
    last_name       = Column(String, nullable=False)
    tc_no           = Column(String, nullable=True)          # TC Kimlik No
    birth_date      = Column(Date, nullable=True)
    gender          = Column(String, nullable=True)          # M / F
    # İletişim
    phone           = Column(String, nullable=True)
    email           = Column(String, nullable=True)
    address         = Column(Text, nullable=True)
    emergency_contact = Column(String, nullable=True)        # Acil iletişim
    emergency_phone   = Column(String, nullable=True)
    # İş bilgileri
    department      = Column(String, nullable=True)          # Departman
    position        = Column(String, nullable=True)          # Pozisyon / Unvan
    hire_date       = Column(Date, nullable=True)            # İşe giriş tarihi
    termination_date= Column(Date, nullable=True)            # Çıkış tarihi
    status          = Column(String, default=EmployeeStatus.active)
    # Finansal
    salary          = Column(Float, default=0)               # Aylık brüt maaş
    iban            = Column(String, nullable=True)          # IBAN
    bank_name       = Column(String, nullable=True)          # Banka adı
    # İzin bakiyesi
    annual_leave_days = Column(Integer, default=14)          # Yıllık izin hakkı
    used_leave_days   = Column(Integer, default=0)           # Kullanılan izin
    # Notlar
    notes           = Column(Text, nullable=True)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())

    leaves          = relationship("EmployeeLeave", back_populates="employee", cascade="all, delete-orphan")
    salary_payments = relationship("SalaryPayment", back_populates="employee", cascade="all, delete-orphan")


class EmployeeLeave(Base):
    __tablename__ = "employee_leaves"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    leave_type  = Column(String, nullable=False, default=LeaveType.annual)
    start_date  = Column(Date, nullable=False)
    end_date    = Column(Date, nullable=False)
    days        = Column(Integer, nullable=False, default=1)
    status      = Column(String, default=LeaveStatus.pending)
    description = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="leaves")


class SalaryPayment(Base):
    __tablename__ = "salary_payments"

    id          = Column(Integer, primary_key=True, index=True)
    employee_id = Column(Integer, ForeignKey("employees.id"), nullable=False)
    period      = Column(String, nullable=False)   # "2024-03" gibi YYYY-MM
    gross       = Column(Float, nullable=False)    # Brüt
    deductions  = Column(Float, default=0)         # Kesintiler (SGK, vergi vb.)
    net         = Column(Float, nullable=False)    # Net ödenen
    paid_date   = Column(Date, nullable=True)
    notes       = Column(String, nullable=True)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())

    employee = relationship("Employee", back_populates="salary_payments")
