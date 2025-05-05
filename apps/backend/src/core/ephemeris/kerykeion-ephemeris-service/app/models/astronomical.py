from pydantic import BaseModel, Field, validator
from typing import List, Optional
from datetime import datetime
from enum import Enum

class HouseSystem(str, Enum):
    """Available house systems for astrological calculations."""
    PLACIDUS = "PLACIDUS"
    KOCH = "KOCH"
    PORPHYRIUS = "PORPHYRIUS"
    REGIOMONTANUS = "REGIOMONTANUS"
    CAMPANUS = "CAMPANUS"
    EQUAL = "EQUAL"
    WHOLE_SIGN = "WHOLE_SIGN"
    MERIDIAN = "MERIDIAN"
    MORINUS = "MORINUS"
    TOPOCENTRIC = "TOPOCENTRIC"

class CelestialBody(str, Enum):
    """Celestial bodies used in astrological calculations."""
    SUN = "SUN"
    MOON = "MOON"
    MERCURY = "MERCURY"
    VENUS = "VENUS"
    MARS = "MARS"
    JUPITER = "JUPITER"
    SATURN = "SATURN"
    URANUS = "URANUS"
    NEPTUNE = "NEPTUNE"
    PLUTO = "PLUTO"
    NORTH_NODE = "NORTH_NODE"
    SOUTH_NODE = "SOUTH_NODE"
    CHIRON = "CHIRON"

class GeoPosition(BaseModel):
    """Geographical position with latitude and longitude."""
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    longitude: float = Field(..., ge=-180, le=180, description="Longitude in degrees")
    altitude: Optional[float] = Field(None, ge=0, description="Altitude in meters")

class DateTime(BaseModel):
    """Date and time information with timezone."""
    year: int = Field(..., ge=1900, le=2100, description="Year")
    month: int = Field(..., ge=1, le=12, description="Month (1-12)")
    day: int = Field(..., ge=1, le=31, description="Day of month (1-31)")
    hour: int = Field(..., ge=0, le=23, description="Hour (0-23)")
    minute: int = Field(..., ge=0, le=59, description="Minute (0-59)")
    second: int = Field(..., ge=0, le=59, description="Second (0-59)")
    timezone: str = Field(default="UTC", description="Timezone name")

    @validator('day')
    def validate_day(cls, v, values):
        """Validate day based on month."""
        if 'month' not in values:
            return v
        month = values['month']
        if month in [4, 6, 9, 11] and v > 30:
            raise ValueError(f"Month {month} has only 30 days")
        if month == 2:
            year = values.get('year', 2000)
            is_leap = year % 4 == 0 and (year % 100 != 0 or year % 400 == 0)
            if is_leap and v > 29:
                raise ValueError("February has only 29 days in leap years")
            if not is_leap and v > 28:
                raise ValueError("February has only 28 days in non-leap years")
        return v

class BodyPosition(BaseModel):
    """Position of a celestial body."""
    id: CelestialBody = Field(..., description="Celestial body identifier")
    longitude: float = Field(..., ge=0, lt=360, description="Longitude in degrees")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    distance: float = Field(..., ge=0, description="Distance from Earth in AU")
    speed: float = Field(..., description="Speed in degrees per day")
    is_retrograde: bool = Field(..., description="Whether the body is retrograde")

class House(BaseModel):
    """Astrological house information."""
    number: int = Field(..., ge=1, le=12, description="House number (1-12)")
    cusp: float = Field(..., ge=0, lt=360, description="House cusp in degrees")
    next_cusp: float = Field(..., ge=0, lt=360, description="Next house cusp in degrees")
    longitude: float = Field(..., ge=0, lt=360, description="Longitude in degrees")
    latitude: float = Field(..., ge=-90, le=90, description="Latitude in degrees")
    size: float = Field(..., ge=0, lt=360, description="House size in degrees")
    ruler_ids: List[CelestialBody] = Field(default_factory=list, description="List of ruling planets")

class Aspect(BaseModel):
    """Aspect between two celestial bodies."""
    body1: CelestialBody = Field(..., description="First celestial body")
    body2: CelestialBody = Field(..., description="Second celestial body")
    type: str = Field(..., description="Type of aspect")
    orb: float = Field(..., ge=0, description="Orb in degrees")
    exact: bool = Field(..., description="Whether the aspect is exact")
    applying: bool = Field(..., description="Whether the aspect is applying")

class ChartAngles(BaseModel):
    """Angular points of the astrological chart."""
    ascendant: float = Field(..., ge=0, lt=360, description="Ascendant in degrees")
    midheaven: float = Field(..., ge=0, lt=360, description="Midheaven in degrees")
    descendant: float = Field(..., ge=0, lt=360, description="Descendant in degrees")
    imum_coeli: float = Field(..., ge=0, lt=360, description="Imum Coeli in degrees")

class BirthChart(BaseModel):
    """Complete birth chart information."""
    datetime: DateTime = Field(..., description="Date and time of birth")
    location: GeoPosition = Field(..., description="Location of birth")
    bodies: List[BodyPosition] = Field(..., description="List of celestial body positions")
    houses: List[House] = Field(..., description="List of houses")
    angles: ChartAngles = Field(..., description="Chart angles")
    aspects: List[Aspect] = Field(..., description="List of aspects between bodies")

class DateRange(BaseModel):
    start: DateTime
    end: DateTime

class AstrologicalEvent(BaseModel):
    datetime: DateTime
    type: str
    description: str
    bodies: List[CelestialBody]

class FixedStar(BaseModel):
    name: str
    longitude: float
    latitude: float
    magnitude: float

class LunarPhase(BaseModel):
    datetime: DateTime
    phase: str
    illumination: float 