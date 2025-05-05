from fastapi import APIRouter, HTTPException
from typing import List
from ..services.kerykeion_service import KerykeionService
from ..models.astronomical import (
    BirthChart,
    DateTime,
    GeoPosition,
    HouseSystem,
    CelestialBody,
    Aspect,
    House,
    AstrologicalEvent,
    FixedStar,
    LunarPhase,
    DateRange
)

router = APIRouter()
kerykeion_service = KerykeionService()

@router.post("/birth-chart", response_model=BirthChart)
async def calculate_birth_chart(
    datetime: DateTime,
    location: GeoPosition,
    house_system: HouseSystem = HouseSystem.PLACIDUS
) -> BirthChart:
    """Calculate a complete birth chart."""
    try:
        return await kerykeion_service.calculate_birth_chart(datetime, location, house_system)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/houses", response_model=List[House])
async def calculate_houses(
    datetime: DateTime,
    location: GeoPosition,
    house_system: HouseSystem = HouseSystem.PLACIDUS
) -> List[House]:
    """Calculate house cusps."""
    try:
        birth_chart = await kerykeion_service.calculate_birth_chart(datetime, location, house_system)
        return birth_chart.houses
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/aspects", response_model=List[Aspect])
async def calculate_aspects(
    datetime: DateTime,
    location: GeoPosition
) -> List[Aspect]:
    """Calculate aspects between celestial bodies."""
    try:
        birth_chart = await kerykeion_service.calculate_birth_chart(datetime, location)
        return birth_chart.aspects
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/transits", response_model=List[Aspect])
async def calculate_transits(
    natal_chart: BirthChart,
    date_range: DateRange,
    orb: float = 1.0
) -> List[Aspect]:
    """Calculate transits for a given date range."""
    try:
        return await kerykeion_service.calculate_transits(natal_chart, date_range, orb)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/significant-events", response_model=List[AstrologicalEvent])
async def calculate_significant_events(
    date_range: DateRange
) -> List[AstrologicalEvent]:
    """Calculate significant astrological events for a date range."""
    # Feature not yet implemented in KerykeionService
    raise HTTPException(
        status_code=501,
        detail="Significant events calculation is not yet implemented"
    )

@router.post("/fixed-stars", response_model=List[FixedStar])
async def calculate_fixed_stars(
    datetime: DateTime
) -> List[FixedStar]:
    """Calculate fixed star positions."""
    # Feature not yet implemented in KerykeionService
    raise HTTPException(
        status_code=501,
        detail="Fixed star calculation is not yet implemented"
    )

@router.post("/lunar-phases", response_model=List[LunarPhase])
async def calculate_lunar_phases(
    date_range: DateRange
) -> List[LunarPhase]:
    """Calculate lunar phases for a date range."""
    # Feature not yet implemented in KerykeionService
    raise HTTPException(
        status_code=501,
        detail="Lunar phase calculation is not yet implemented"
    ) 