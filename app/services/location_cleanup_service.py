"""
Location Cleanup Service

Provides functionality to clean up old ambulance location data
to keep the database size manageable.
"""

from datetime import datetime, timedelta, timezone
from typing import Dict

from sqlalchemy import delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.ambulance import AmbulanceLocationUpdate


class LocationCleanupService:
    """Service for cleaning up old ambulance location data"""

    async def cleanup_old_locations(
        self, db: AsyncSession, hours: int = 24
    ) -> Dict:
        """
        Delete location updates older than specified hours.

        Args:
            db: Database session
            hours: Number of hours to retain (default: 24)

        Returns:
            Dict containing:
                - deleted_count: Number of records deleted
                - cutoff_time: ISO format timestamp of cutoff time
        """
        if hours <= 0:
            raise ValueError("hours must be positive")

        cutoff_time = datetime.now(timezone.utc) - timedelta(hours=hours)

        result = await db.execute(
            delete(AmbulanceLocationUpdate).where(
                AmbulanceLocationUpdate.timestamp < cutoff_time
            )
        )

        deleted_count = result.rowcount

        return {
            "deleted_count": deleted_count,
            "cutoff_time": cutoff_time.isoformat(),
        }


# Global service instance
location_cleanup_service = LocationCleanupService()
