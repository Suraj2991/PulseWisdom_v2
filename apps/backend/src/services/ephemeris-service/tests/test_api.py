import pytest
from fastapi.testclient import TestClient
from datetime import datetime
import pytz
from app.main import app
from app.models.astronomical import DateTime, GeoPosition, HouseSystem, CelestialBody

client = TestClient(app)

@pytest.fixture
def test_datetime():
    """Create a test datetime for Mumbai."""
    mumbai_tz = pytz.timezone('Asia/Kolkata')
    dt = datetime(1991, 9, 29, 11, 44, tzinfo=mumbai_tz)
    return DateTime(
        year=dt.year,
        month=dt.month,
        day=dt.day,
        hour=dt.hour,
        minute=dt.minute,
        timezone=dt.tzinfo.zone
    )

@pytest.fixture
def test_location():
    """Create a test location for Mumbai."""
    return GeoPosition(
        latitude=19.0760,
        longitude=72.8777
    )

def test_health_check():
    """Test the health check endpoint."""
    response = client.get("/health")
    assert response.status_code == 200
    assert response.json() == {"status": "healthy"}

def test_calculate_birth_chart(test_datetime, test_location):
    """Test the birth chart calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/birth-chart",
        json={
            "datetime": test_datetime.dict(),
            "location": test_location.dict(),
            "house_system": HouseSystem.PLACIDUS.value
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert "angles" in data
    assert "bodies" in data
    assert "houses" in data
    assert "aspects" in data

def test_calculate_houses(test_datetime, test_location):
    """Test the houses calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/houses",
        json={
            "datetime": test_datetime.dict(),
            "location": test_location.dict(),
            "house_system": HouseSystem.PLACIDUS.value
        }
    )
    assert response.status_code == 200
    data = response.json()
    assert len(data) == 12  # Should have 12 houses

def test_calculate_aspects():
    """Test the aspects calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/aspects",
        json={
            "bodies": [CelestialBody.SUN.value, CelestialBody.MOON.value]
        }
    )
    assert response.status_code == 501  # Should be NotImplementedError

def test_calculate_transits(test_datetime, test_location):
    """Test the transits calculation endpoint."""
    # First get a birth chart
    birth_chart_response = client.post(
        "/api/v1/ephemeris/birth-chart",
        json={
            "datetime": test_datetime.dict(),
            "location": test_location.dict(),
            "house_system": HouseSystem.PLACIDUS.value
        }
    )
    birth_chart = birth_chart_response.json()
    
    # Then calculate transits
    response = client.post(
        "/api/v1/ephemeris/transits",
        json={
            "natal_chart": birth_chart,
            "date_range": {
                "start": test_datetime.dict(),
                "end": test_datetime.dict()
            }
        }
    )
    assert response.status_code == 501  # Should be NotImplementedError

def test_calculate_significant_events(test_datetime):
    """Test the significant events calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/significant-events",
        json={
            "date_range": {
                "start": test_datetime.dict(),
                "end": test_datetime.dict()
            }
        }
    )
    assert response.status_code == 501  # Should be NotImplementedError

def test_calculate_fixed_stars(test_datetime):
    """Test the fixed stars calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/fixed-stars",
        json={
            "datetime": test_datetime.dict()
        }
    )
    assert response.status_code == 501  # Should be NotImplementedError

def test_calculate_lunar_phases(test_datetime):
    """Test the lunar phases calculation endpoint."""
    response = client.post(
        "/api/v1/ephemeris/lunar-phases",
        json={
            "date_range": {
                "start": test_datetime.dict(),
                "end": test_datetime.dict()
            }
        }
    )
    assert response.status_code == 501  # Should be NotImplementedError 