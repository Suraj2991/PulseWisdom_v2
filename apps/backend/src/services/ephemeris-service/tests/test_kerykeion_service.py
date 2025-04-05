import pytest
from datetime import datetime
import pytz
from app.services.kerykeion_service import KerykeionService
from app.models.astronomical import (
    DateTime,
    GeoPosition,
    HouseSystem,
    BirthChart,
    DateRange
)

@pytest.fixture
def kerykeion_service():
    """Create a KerykeionService instance."""
    return KerykeionService()

@pytest.fixture
def sample_birth_data():
    # Create a sample birth time (January 1, 2000, 12:00 PM EST)
    est = pytz.timezone('America/New_York')
    dt = datetime(2000, 1, 1, 12, 0, 0, tzinfo=est)
    
    return DateTime(
        year=dt.year,
        month=dt.month,
        day=dt.day,
        hour=dt.hour,
        minute=dt.minute,
        second=dt.second,
        timezone='America/New_York'  # Use proper timezone name
    )

@pytest.fixture
def sample_location():
    return GeoPosition(
        latitude=40.7128,  # New York City latitude
        longitude=-74.0060  # New York City longitude
    )

@pytest.fixture
def mumbai_birth_data():
    """Create test data for Mumbai birth chart."""
    return {
        "datetime": DateTime(
            year=1991,
            month=9,
            day=29,
            hour=11,
            minute=44,
            second=0,
            timezone="Asia/Kolkata"
        ),
        "location": GeoPosition(
            latitude=19.0760,
            longitude=72.8777
        ),
        "house_system": HouseSystem.PLACIDUS
    }

@pytest.fixture
async def mumbai_birth_chart(kerykeion_service, mumbai_birth_data):
    """Calculate Mumbai birth chart."""
    return await kerykeion_service.calculate_birth_chart(
        mumbai_birth_data["datetime"],
        mumbai_birth_data["location"],
        mumbai_birth_data["house_system"]
    )

@pytest.fixture
def transit_date():
    """Create test data for transit date."""
    return DateTime(
        year=2024,
        month=4,
        day=2,
        hour=12,
        minute=0,
        second=0,
        timezone="Asia/Kolkata"
    )

@pytest.mark.asyncio
async def test_calculate_birth_chart(kerykeion_service, mumbai_birth_data):
    """Test birth chart calculation."""
    birth_chart = await kerykeion_service.calculate_birth_chart(
        mumbai_birth_data["datetime"],
        mumbai_birth_data["location"],
        mumbai_birth_data["house_system"]
    )
    
    assert birth_chart is not None
    assert birth_chart.angles is not None
    assert birth_chart.bodies is not None
    assert birth_chart.houses is not None
    assert birth_chart.aspects is not None
    
    # Verify specific positions
    sun = next(body for body in birth_chart.bodies if body.id == "SUN")
    assert 185.0 <= sun.longitude <= 186.0  # Sun should be around 185.61° (Libra)
    
    moon = next(body for body in birth_chart.bodies if body.id == "MOON")
    assert 72.0 <= moon.longitude <= 73.0  # Moon should be around 72.64° (Gemini)
    
    # Verify house cusps
    assert len(birth_chart.houses) == 12
    asc_house = birth_chart.houses[0]
    assert 256.0 <= asc_house.cusp <= 257.0  # Ascendant should be around 256.69° (Sagittarius)

@pytest.mark.asyncio
async def test_calculate_transits(kerykeion_service, mumbai_birth_data, transit_date):
    """Test transit calculation."""
    # First get the birth chart
    birth_chart = await kerykeion_service.calculate_birth_chart(
        mumbai_birth_data["datetime"],
        mumbai_birth_data["location"],
        mumbai_birth_data["house_system"]
    )
    
    date_range = DateRange(
        start=transit_date,
        end=transit_date  # Same date for single-point transit
    )
    
    transits = await kerykeion_service.calculate_transits(
        birth_chart,
        date_range,
        orb=1.0
    )
    
    assert transits is not None
    assert isinstance(transits, list)
    
    # Log transit aspects for inspection
    for aspect in transits:
        print(f"Transit: {aspect.body1.value} {aspect.type} Natal {aspect.body2.value} "
              f"(Orb: {aspect.orb:.2f}°, Applying: {aspect.applying})")
    
    # Verify some basic properties
    for aspect in transits:
        assert aspect.orb <= 1.0  # Should respect the orb limit
        assert hasattr(aspect, 'applying')  # Should indicate if aspect is applying
        assert aspect.type in ["conjunction", "opposition", "trine", "square", "sextile"]  # Major aspects

@pytest.mark.asyncio
async def test_mumbai_birth_chart(kerykeion_service):
    """Test birth chart calculation for Mumbai, September 29, 1991, 11:44 AM IST."""
    # Mumbai birth data
    birth_data = DateTime(
        year=1991,
        month=9,
        day=29,
        hour=11,
        minute=44,
        second=0,
        timezone='Asia/Kolkata'  # IST timezone
    )
    
    # Mumbai coordinates
    location = GeoPosition(
        latitude=19.0760,  # Mumbai latitude
        longitude=72.8777  # Mumbai longitude
    )
    
    # Calculate the birth chart
    birth_chart = await kerykeion_service.calculate_birth_chart(
        birth_data,
        location,
        HouseSystem.PLACIDUS
    )
    
    # Print the birth chart details
    print("\nBirth Chart Details for Mumbai, September 29, 1991, 11:44 AM IST:")
    print("=" * 80)
    print(f"Ascendant: {birth_chart.angles.ascendant:.2f}°")
    print(f"Midheaven: {birth_chart.angles.midheaven:.2f}°")
    print("\nPlanetary Positions:")
    print("-" * 40)
    for body in birth_chart.bodies:
        print(f"{body.id.value}: {body.longitude:.2f}°")
    
    print("\nHouse Cusps:")
    print("-" * 40)
    for i, house in enumerate(birth_chart.houses, 1):
        print(f"House {i}: {house.cusp:.2f}°")
    
    print("\nMajor Aspects:")
    print("-" * 40)
    for aspect in birth_chart.aspects:
        if aspect.orb <= 8:  # Only show aspects with orb <= 8 degrees
            print(f"{aspect.body1.value} {aspect.type} {aspect.body2.value} (orb: {aspect.orb:.2f}°)")
    
    # Basic assertions
    assert birth_chart is not None
    assert birth_chart.location == location
    assert len(birth_chart.bodies) > 0
    assert len(birth_chart.houses) == 12 