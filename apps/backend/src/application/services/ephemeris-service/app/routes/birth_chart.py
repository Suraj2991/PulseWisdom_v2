from fastapi import APIRouter, HTTPException, Query
from typing import Optional
from ..models.astronomical import BirthChart, DateTime, GeoPosition, HouseSystem
from ..services.kerykeion_service import KerykeionService
import logging

logger = logging.getLogger(__name__)
router = APIRouter(prefix="/birth-chart", tags=["birth-chart"])
kerykeion_service = KerykeionService()

@router.post("/calculate", response_model=BirthChart)
async def calculate_birth_chart(
    datetime: DateTime,
    location: GeoPosition,
    house_system: HouseSystem = Query(
        default=HouseSystem.PLACIDUS,
        description="The house system to use for calculations"
    )
) -> BirthChart:
    """
    Calculate a complete birth chart for the given datetime and location.
    
    Args:
        datetime: The date and time of birth
        location: The geographical location of birth
        house_system: The house system to use (default: PLACIDUS)
    
    Returns:
        BirthChart: A complete birth chart with all planetary positions, houses, and aspects
    
    Raises:
        HTTPException: If the calculation fails or invalid input is provided
    """
    try:
        logger.info(f"Calculating birth chart for {datetime} at {location}")
        return await kerykeion_service.calculate_birth_chart(
            datetime=datetime,
            location=location,
            house_system=house_system
        )
    except ValueError as e:
        logger.error(f"Invalid input: {str(e)}")
        raise HTTPException(
            status_code=400,
            detail=f"Invalid input: {str(e)}"
        )
    except Exception as e:
        logger.error(f"Failed to calculate birth chart: {str(e)}", exc_info=True)
        raise HTTPException(
            status_code=500,
            detail="Failed to calculate birth chart. Please try again later."
        ) 