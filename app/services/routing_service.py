"""
Routing service for calculating routes and ETAs.

Integrates with OSRM (Open Source Routing Machine) for route calculation
with fallback to Haversine formula for straight-line distance.
"""

import logging
import math
from datetime import datetime, timedelta, timezone
from typing import Dict, List, Optional, Tuple

import httpx

logger = logging.getLogger(__name__)


class RoutingService:
    """Service for route calculation and ETA estimation."""
    
    def __init__(self):
        """Initialize routing service with OSRM configuration."""
        self.osrm_base_url = "https://router.project-osrm.org"
        self.timeout = 5.0
        self.default_speed_kmh = 40.0  # Average speed for fallback calculations
        self.client = None
    
    async def __aenter__(self):
        """Async context manager entry."""
        self.client = httpx.AsyncClient(timeout=self.timeout)
        return self
    
    async def __aexit__(self, exc_type, exc_val, exc_tb):
        """Async context manager exit."""
        if self.client:
            await self.client.aclose()
    
    def _validate_coordinates(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> None:
        """Validate coordinate ranges.
        
        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            dest_lat: Destination latitude
            dest_lng: Destination longitude
            
        Raises:
            ValueError: If coordinates are out of valid range
        """
        if not -90 <= origin_lat <= 90:
            raise ValueError(f"Origin latitude {origin_lat} out of range [-90, 90]")
        if not -180 <= origin_lng <= 180:
            raise ValueError(f"Origin longitude {origin_lng} out of range [-180, 180]")
        if not -90 <= dest_lat <= 90:
            raise ValueError(f"Destination latitude {dest_lat} out of range [-90, 90]")
        if not -180 <= dest_lng <= 180:
            raise ValueError(f"Destination longitude {dest_lng} out of range [-180, 180]")
    
    async def calculate_route(
        self,
        origin_lat: float,
        origin_lng: float,
        dest_lat: float,
        dest_lng: float
    ) -> Dict:
        """
        Calculate route from origin to destination.
        
        Args:
            origin_lat: Origin latitude
            origin_lng: Origin longitude
            dest_lat: Destination latitude
            dest_lng: Destination longitude
            
        Returns:
            Dict with:
                - distance_km: Distance in kilometers
                - duration_minutes: Estimated duration in minutes
                - coordinates: List of [lng, lat] coordinate pairs (if available)
        """
        # Validate coordinates
        self._validate_coordinates(origin_lat, origin_lng, dest_lat, dest_lng)
        
        try:
            # Try OSRM API first
            if not self.client:
                self.client = httpx.AsyncClient(timeout=self.timeout)
            
            # OSRM route endpoint format: /route/v1/{profile}/{coordinates}
            # Coordinates format: lng,lat;lng,lat
            url = (
                f"{self.osrm_base_url}/route/v1/driving/"
                f"{origin_lng},{origin_lat};{dest_lng},{dest_lat}"
            )
            params = {
                "overview": "full",  # Get full route geometry
                "geometries": "geojson"  # Return coordinates as GeoJSON
            }
            
            logger.info(f"Requesting route from OSRM: {url}")
            response = await self.client.get(url, params=params)
            response.raise_for_status()
            
            data = response.json()
            
            if data.get("code") != "Ok" or not data.get("routes"):
                logger.warning(f"OSRM returned no routes: {data.get('code')}")
                return self._calculate_straight_line(
                    origin_lat, origin_lng, dest_lat, dest_lng
                )
            
            route = data["routes"][0]
            distance_m = route["distance"]
            duration_s = route["duration"]
            coordinates = route["geometry"]["coordinates"]
            
            logger.info(
                f"OSRM route calculated: {distance_m/1000:.2f} km, "
                f"{duration_s/60:.1f} minutes"
            )
            
            return {
                "distance_km": distance_m / 1000,
                "duration_minutes": duration_s / 60,
                "coordinates": coordinates
            }
                
        except httpx.TimeoutException:
            logger.warning("OSRM request timed out, using fallback calculation")
        except httpx.HTTPError as e:
            logger.warning(f"OSRM HTTP error: {e}, using fallback calculation")
        except Exception as e:
            logger.error(f"Unexpected error calling OSRM: {e}, using fallback calculation")
        
        # Fallback to straight-line calculation
        return self._calculate_straight_line(
            origin_lat, origin_lng, dest_lat, dest_lng
        )
    
    def _calculate_straight_line(
        self,
        lat1: float,
        lng1: float,
        lat2: float,
        lng2: float
    ) -> Dict:
        """
        Calculate straight-line distance using Haversine formula.
        
        Args:
            lat1: Origin latitude
            lng1: Origin longitude
            lat2: Destination latitude
            lng2: Destination longitude
            
        Returns:
            Dict with:
                - distance_km: Straight-line distance in kilometers
                - duration_minutes: Estimated duration at default speed
                - coordinates: List with origin and destination only
        """
        # Earth's radius in kilometers
        R = 6371.0
        
        # Convert degrees to radians
        lat1_rad = math.radians(lat1)
        lng1_rad = math.radians(lng1)
        lat2_rad = math.radians(lat2)
        lng2_rad = math.radians(lng2)
        
        # Haversine formula
        dlat = lat2_rad - lat1_rad
        dlng = lng2_rad - lng1_rad
        
        a = (
            math.sin(dlat / 2) ** 2 +
            math.cos(lat1_rad) * math.cos(lat2_rad) * math.sin(dlng / 2) ** 2
        )
        c = 2 * math.atan2(math.sqrt(a), math.sqrt(1 - a))
        distance_km = R * c
        
        # Estimate duration at default speed (40 km/h)
        duration_minutes = (distance_km / self.default_speed_kmh) * 60
        
        logger.info(
            f"Straight-line calculation: {distance_km:.2f} km, "
            f"{duration_minutes:.1f} minutes"
        )
        
        return {
            "distance_km": distance_km,
            "duration_minutes": duration_minutes,
            "coordinates": [[lng1, lat1], [lng2, lat2]]
        }
    
    def calculate_eta(
        self,
        distance_km: float,
        current_speed_kmh: Optional[float] = None
    ) -> Dict:
        """
        Calculate estimated time of arrival.
        
        Args:
            distance_km: Remaining distance in kilometers
            current_speed_kmh: Current speed in km/h (optional, uses default if not provided)
            
        Returns:
            Dict with:
                - estimated_arrival: Datetime of estimated arrival
                - minutes_remaining: Minutes until arrival
        """
        # Use current speed if provided, otherwise use default
        speed = current_speed_kmh if current_speed_kmh and current_speed_kmh > 0 else self.default_speed_kmh
        
        # Calculate time remaining in minutes
        minutes_remaining = (distance_km / speed) * 60
        
        # Calculate estimated arrival time
        estimated_arrival = datetime.now(timezone.utc) + timedelta(minutes=minutes_remaining)
        
        logger.debug(
            f"ETA calculated: {minutes_remaining:.1f} minutes "
            f"(distance: {distance_km:.2f} km, speed: {speed:.1f} km/h)"
        )
        
        return {
            "estimated_arrival": estimated_arrival,
            "minutes_remaining": int(minutes_remaining)
        }


# Global instance for use throughout the application
routing_service = RoutingService()
