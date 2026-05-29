from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from sqlalchemy import func, or_
from typing import Optional, List
import logging

from app.database import get_db
from app.dependencies import get_current_user
from app.models.user import User
from app.models.report import Report
from app.models.report_message import ReportMessage
from app.schemas.report import (
    ReportCreate,
    ReportResponse,
    ReportListResponse,
    ReportUpdateStatus,
    ReportMessageCreate,
    ReportMessageResponse,
)

router = APIRouter(prefix="/reports", tags=["Reports"])
logger = logging.getLogger(__name__)


async def _build_report_response(report: Report, db: AsyncSession) -> dict:
    """Helper untuk build response dengan nama reporter & reported."""
    # Ambil nama reporter
    result = await db.execute(select(User.full_name).where(User.id == report.reporter_id))
    reporter_name = result.scalar_one_or_none() or "Unknown"

    # Ambil nama reported
    result = await db.execute(select(User.full_name).where(User.id == report.reported_id))
    reported_name = result.scalar_one_or_none() or "Unknown"

    return {
        "id": report.id,
        "reporter_id": report.reporter_id,
        "reported_id": report.reported_id,
        "reporter_role": report.reporter_role,
        "reported_role": report.reported_role,
        "reporter_name": reporter_name,
        "reported_name": reported_name,
        "reason": report.reason,
        "description": report.description,
        "context_type": report.context_type,
        "context_id": report.context_id,
        "status": report.status,
        "admin_notes": report.admin_notes,
        "created_at": report.created_at,
        "updated_at": report.updated_at,
    }


async def _notify_admins(event_type: str, payload: dict, db: AsyncSession):
    """Send WebSocket notification to all online admin users."""
    try:
        from app.Websocket.manager import manager
        # Find all admin user IDs
        result = await db.execute(select(User.id).where(User.role == "admin"))
        admin_ids = [str(row[0]) for row in result.fetchall()]
        for admin_id in admin_ids:
            await manager.send_message(admin_id, {
                "type": event_type,
                **payload,
            })
    except Exception as e:
        logger.warning(f"Failed to notify admins: {e}")


@router.post("", response_model=ReportResponse, status_code=status.HTTP_201_CREATED)
async def create_report(
    data: ReportCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Buat laporan baru terhadap user lain."""
    # Tidak bisa melaporkan diri sendiri
    if str(current_user.id) == str(data.reported_id):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Tidak bisa melaporkan diri sendiri",
        )

    # Cek user yang dilaporkan ada
    result = await db.execute(select(User).where(User.id == data.reported_id))
    reported_user = result.scalar_one_or_none()
    if not reported_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User yang dilaporkan tidak ditemukan",
        )

    # Cek duplikat: satu user hanya bisa report user lain 1x per context_id
    if data.context_id:
        result = await db.execute(
            select(Report).where(
                Report.reporter_id == current_user.id,
                Report.reported_id == data.reported_id,
                Report.context_id == data.context_id,
            )
        )
        existing = result.scalar_one_or_none()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Anda sudah pernah melaporkan user ini pada konteks yang sama",
            )

    report = Report(
        reporter_id=current_user.id,
        reported_id=data.reported_id,
        reporter_role=current_user.role or "patient",
        reported_role=reported_user.role or "patient",
        reason=data.reason,
        description=data.description,
        context_type=data.context_type,
        context_id=data.context_id,
    )

    db.add(report)
    await db.commit()
    await db.refresh(report)

    logger.info(
        f"Report created: {current_user.id} ({current_user.role}) -> "
        f"{reported_user.id} ({reported_user.role}), reason={data.reason}"
    )

    response_data = await _build_report_response(report, db)

    # Notify all admins via WebSocket
    await _notify_admins("new_report", {
        "report": {
            **response_data,
            "id": str(response_data["id"]),
            "reporter_id": str(response_data["reporter_id"]),
            "reported_id": str(response_data["reported_id"]),
            "context_id": str(response_data["context_id"]) if response_data.get("context_id") else None,
            "created_at": response_data["created_at"].isoformat() if response_data.get("created_at") else None,
            "updated_at": response_data["updated_at"].isoformat() if response_data.get("updated_at") else None,
        },
        "message": f"Laporan baru dari {current_user.full_name}: {data.reason}",
    }, db)

    return response_data


@router.get("/my", response_model=ReportListResponse)
async def get_my_reports(
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Lihat semua laporan yang pernah saya buat."""
    result = await db.execute(
        select(Report)
        .where(Report.reporter_id == current_user.id)
        .order_by(Report.created_at.desc())
    )
    reports = result.scalars().all()

    report_list = []
    for r in reports:
        report_list.append(await _build_report_response(r, db))

    return {"reports": report_list, "total": len(report_list)}


@router.get("", response_model=ReportListResponse)
async def get_all_reports(
    status_filter: Optional[str] = Query(None, alias="status"),
    user_id: Optional[str] = Query(None, alias="user_id"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """(Admin only) Lihat semua laporan dengan optional filter status dan user_id."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengakses daftar semua laporan",
        )

    query = select(Report).order_by(Report.created_at.desc())
    if status_filter:
        query = query.where(Report.status == status_filter)
    if user_id:
        query = query.where(
            or_(Report.reporter_id == user_id, Report.reported_id == user_id)
        )

    result = await db.execute(query)
    reports = result.scalars().all()

    # Total count (without filter for pagination info)
    count_query = select(func.count(Report.id))
    if status_filter:
        count_query = count_query.where(Report.status == status_filter)
    if user_id:
        count_query = count_query.where(
            or_(Report.reporter_id == user_id, Report.reported_id == user_id)
        )
    count_result = await db.execute(count_query)
    total = count_result.scalar() or 0

    report_list = []
    for r in reports:
        report_list.append(await _build_report_response(r, db))

    return {"reports": report_list, "total": total}


@router.patch("/{report_id}/status", response_model=ReportResponse)
async def update_report_status(
    report_id: str,
    data: ReportUpdateStatus,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """(Admin only) Update status laporan."""
    if current_user.role != "admin":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Hanya admin yang dapat mengubah status laporan",
        )

    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Laporan tidak ditemukan",
        )

    report.status = data.status
    if data.admin_notes is not None:
        report.admin_notes = data.admin_notes

    await db.commit()
    await db.refresh(report)

    logger.info(f"Report {report_id} status updated to {data.status} by admin {current_user.id}")

    # Notify the reporter via WebSocket about status change
    try:
        from app.Websocket.manager import manager
        await manager.send_message(str(report.reporter_id), {
            "type": "report_status_update",
            "report_id": str(report.id),
            "new_status": data.status,
            "admin_notes": data.admin_notes,
        })
    except Exception as e:
        logger.warning(f"Failed to notify reporter: {e}")

    return await _build_report_response(report, db)


# ============================================
# REPORT MESSAGES (Chat patient <-> admin)
# ============================================

@router.get("/{report_id}/messages", response_model=List[ReportMessageResponse])
async def get_report_messages(
    report_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Ambil semua pesan chat untuk sebuah report. Hanya reporter atau admin yang bisa akses."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report tidak ditemukan")

    # Auth: hanya reporter atau admin
    if str(current_user.id) != str(report.reporter_id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")

    result = await db.execute(
        select(ReportMessage)
        .where(ReportMessage.report_id == report_id)
        .order_by(ReportMessage.created_at.asc())
    )
    messages = result.scalars().all()

    response = []
    for msg in messages:
        user_result = await db.execute(
            select(User.full_name, User.role).where(User.id == msg.sender_id)
        )
        row = user_result.first()
        response.append({
            "id": msg.id,
            "report_id": msg.report_id,
            "sender_id": msg.sender_id,
            "sender_name": row[0] if row else "Unknown",
            "sender_role": row[1] if row else "unknown",
            "content": msg.content,
            "created_at": msg.created_at,
        })

    return response


@router.post("/{report_id}/messages", response_model=ReportMessageResponse, status_code=201)
async def send_report_message(
    report_id: str,
    data: ReportMessageCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Kirim pesan chat di sebuah report. Hanya reporter atau admin."""
    result = await db.execute(select(Report).where(Report.id == report_id))
    report = result.scalar_one_or_none()
    if not report:
        raise HTTPException(status_code=404, detail="Report tidak ditemukan")

    # Auth: hanya reporter atau admin
    if str(current_user.id) != str(report.reporter_id) and current_user.role != "admin":
        raise HTTPException(status_code=403, detail="Akses ditolak")

    msg = ReportMessage(
        report_id=report.id,
        sender_id=current_user.id,
        content=data.content,
    )
    db.add(msg)
    await db.commit()
    await db.refresh(msg)

    msg_payload = {
        "type": "report_message",
        "report_id": str(report.id),
        "message_id": str(msg.id),
        "sender_id": str(current_user.id),
        "sender_name": current_user.full_name or "Unknown",
        "sender_role": current_user.role or "unknown",
        "content": data.content,
        "created_at": msg.created_at.isoformat(),
    }

    try:
        from app.Websocket.manager import manager
        if current_user.role == "admin":
            # Admin sent message → notify the reporter
            await manager.send_message(str(report.reporter_id), msg_payload)
        else:
            # Reporter sent message → notify all admins
            await _notify_admins("report_message", {
                "report_id": str(report.id),
                "message_id": str(msg.id),
                "sender_id": str(current_user.id),
                "sender_name": current_user.full_name or "Unknown",
                "sender_role": current_user.role or "unknown",
                "content": data.content,
                "created_at": msg.created_at.isoformat(),
            }, db)
    except Exception as e:
        logger.warning(f"Failed to send WS notification for report message: {e}")

    return {
        "id": msg.id,
        "report_id": msg.report_id,
        "sender_id": msg.sender_id,
        "sender_name": current_user.full_name or "Unknown",
        "sender_role": current_user.role or "unknown",
        "content": msg.content,
        "created_at": msg.created_at,
    }

