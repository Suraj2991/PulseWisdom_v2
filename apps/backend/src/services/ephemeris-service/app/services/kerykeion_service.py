from kerykeion import AstrologicalSubject, Planet, KerykeionPointModel
from kerykeion.aspects import NatalAspects, SynastryAspects
from datetime import datetime, timedelta
from typing import List, Dict, Any
import logging
import swisseph as swe
from ..models.astronomical import (
    BirthChart,
    DateTime,
    GeoPosition,
    HouseSystem,
    CelestialBody,
    BodyPosition,
    House,
    Aspect,
    ChartAngles,
    DateRange
)
import pytz
from fastapi import HTTPException

logger = logging.getLogger(__name__)

class KerykeionService:
    """Service for calculating birth charts using Kerykeion."""

    def __init__(self):
        """Initialize the service."""
        self._instances = {}
        swe.set_ephe_path()

    def _get_or_create_instance(self, datetime: DateTime, location: GeoPosition) -> AstrologicalSubject:
        """Get or create a Kerykeion instance for the given datetime and location."""
        try:
            key = f"{datetime.year}-{datetime.month}-{datetime.day}-{datetime.hour}-{location.latitude}-{location.longitude}"
            
            if key not in self._instances:
                logger.info(f"Creating new AstrologicalSubject for {key}")
                self._instances[key] = AstrologicalSubject(
                    name="User",
                    year=datetime.year,
                    month=datetime.month,
                    day=datetime.day,
                    hour=datetime.hour,
                    minute=datetime.minute,
                    lat=float(location.latitude),  # Ensure float type
                    lng=float(location.longitude),  # Ensure float type
                    tz_str=datetime.timezone
                )
            
            return self._instances[key]
        except Exception as e:
            logger.error(f"Error creating AstrologicalSubject: {str(e)}", exc_info=True)
            raise

    def _get_point_data(self, point: KerykeionPointModel) -> Dict[str, Any]:
        """Extract relevant data from a Kerykeion point."""
        return {
            'longitude': point.abs_pos,
            'is_retrograde': point.retrograde
        }

    def _get_house_rulers(self, house_number: int) -> List[CelestialBody]:
        """Calculate house rulers based on traditional rulerships."""
        # Traditional rulerships
        rulers = {
            1: [CelestialBody.MARS],  # Aries
            2: [CelestialBody.VENUS],  # Taurus
            3: [CelestialBody.MERCURY],  # Gemini
            4: [CelestialBody.MOON],  # Cancer
            5: [CelestialBody.SUN],  # Leo
            6: [CelestialBody.MERCURY],  # Virgo
            7: [CelestialBody.VENUS],  # Libra
            8: [CelestialBody.PLUTO],  # Scorpio
            9: [CelestialBody.JUPITER],  # Sagittarius
            10: [CelestialBody.SATURN],  # Capricorn
            11: [CelestialBody.URANUS],  # Aquarius
            12: [CelestialBody.NEPTUNE]  # Pisces
        }
        return rulers.get(house_number, [])

    def _calculate_house_size(self, cusp1: float, cusp2: float) -> float:
        """Calculate house size, handling 0/360 boundary correctly."""
        if cusp2 < cusp1:
            cusp2 += 360
        return cusp2 - cusp1

    def _convert_to_gmt(self, dt: datetime, timezone: str) -> datetime:
        """Convert a datetime from any timezone to GMT."""
        try:
            # Create timezone object
            tz = pytz.timezone(timezone)
            
            # Localize the datetime to the input timezone
            local_dt = tz.localize(dt)
            
            # Convert to GMT
            gmt_dt = local_dt.astimezone(pytz.UTC)
            
            return gmt_dt
        except Exception as e:
            logger.error(f"Error converting timezone: {str(e)}", exc_info=True)
            raise

    async def calculate_birth_chart(
        self,
        birth_datetime: DateTime,
        location: GeoPosition,
        house_system: HouseSystem = HouseSystem.PLACIDUS
    ) -> BirthChart:
        """Calculate a complete birth chart using Kerykeion."""
        try:
            # Convert input datetime to GMT
            local_dt = datetime(
                birth_datetime.year,
                birth_datetime.month,
                birth_datetime.day,
                birth_datetime.hour,
                birth_datetime.minute,
                birth_datetime.second or 0
            )
            gmt_dt = self._convert_to_gmt(local_dt, birth_datetime.timezone)
            
            # Create GMT DateTime object for Kerykeion
            gmt_datetime = DateTime(
                year=gmt_dt.year,
                month=gmt_dt.month,
                day=gmt_dt.day,
                hour=gmt_dt.hour,
                minute=gmt_dt.minute,
                second=gmt_dt.second,
                timezone="GMT"
            )
            
            logger.info(f"Calculating birth chart for {gmt_datetime} (converted from {birth_datetime.timezone}) at {location}")
            instance = self._get_or_create_instance(gmt_datetime, location)
            
            # Calculate angles
            logger.info("Calculating angles")
            try:
                angles = ChartAngles(
                    ascendant=instance.ascendant.abs_pos,
                    midheaven=instance.medium_coeli.abs_pos,
                    descendant=instance.descendant.abs_pos,
                    imum_coeli=instance.imum_coeli.abs_pos
                )
                logger.info(f"Calculated angles: Ascendant={angles.ascendant:.2f}°, MC={angles.midheaven:.2f}°, DC={angles.descendant:.2f}°, IC={angles.imum_coeli:.2f}°")
            except Exception as e:
                logger.error(f"Error calculating angles: {str(e)}", exc_info=True)
                raise
            
            # Calculate body positions
            logger.info("Calculating body positions")
            bodies = []
            try:
                for body in CelestialBody:
                    try:
                        logger.debug(f"Getting data for body: {body.value}")
                        planet = getattr(instance, body.value.lower(), None)
                        if planet and isinstance(planet, KerykeionPointModel):
                            data = self._get_point_data(planet)
                            body_pos = BodyPosition(
                                id=body,
                                longitude=data['longitude'],
                                latitude=0,  # Not needed for basic calculations
                                distance=0,  # Not needed for basic calculations
                                speed=0,  # Not needed for basic calculations
                                is_retrograde=data['is_retrograde']
                            )
                            bodies.append(body_pos)
                            logger.info(f"Body {body.value}: Longitude={body_pos.longitude:.2f}°, Retrograde={body_pos.is_retrograde}")
                    except Exception as e:
                        logger.warning(f"Error calculating position for {body.value}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error getting body data: {str(e)}", exc_info=True)
                raise
            
            # Calculate houses
            logger.info("Calculating houses")
            houses = []
            try:
                house_attrs = [
                    instance.first_house,
                    instance.second_house,
                    instance.third_house,
                    instance.fourth_house,
                    instance.fifth_house,
                    instance.sixth_house,
                    instance.seventh_house,
                    instance.eighth_house,
                    instance.ninth_house,
                    instance.tenth_house,
                    instance.eleventh_house,
                    instance.twelfth_house
                ]
                
                for i, house in enumerate(house_attrs, 1):
                    try:
                        if not isinstance(house, KerykeionPointModel):
                            continue
                            
                        next_house = house_attrs[i] if i < 12 else house_attrs[0]
                        if not isinstance(next_house, KerykeionPointModel):
                            continue
                        
                        house_obj = House(
                            number=i,
                            cusp=house.abs_pos,
                            next_cusp=next_house.abs_pos,
                            longitude=house.abs_pos,
                            latitude=0,
                            size=self._calculate_house_size(house.abs_pos, next_house.abs_pos),
                            ruler_ids=self._get_house_rulers(i)
                        )
                        houses.append(house_obj)
                        logger.info(f"House {i}: Cusp={house_obj.cusp:.2f}°, Next Cusp={house_obj.next_cusp:.2f}°, Size={house_obj.size:.2f}°, Rulers={[r.value for r in house_obj.ruler_ids]}")
                    except Exception as e:
                        logger.warning(f"Error calculating house {i}: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error getting house data: {str(e)}", exc_info=True)
                raise
            
            # Calculate aspects
            logger.info("Calculating aspects")
            aspects = []
            try:
                natal_aspects = NatalAspects(instance)
                for aspect in natal_aspects.relevant_aspects:
                    try:
                        # Skip invalid celestial bodies
                        if aspect.p1_name.upper() not in [b.value for b in CelestialBody] or \
                           aspect.p2_name.upper() not in [b.value for b in CelestialBody]:
                            continue
                            
                        # Ensure orb is positive
                        orb = aspect.orbit
                        is_applying = orb < 0  # Negative orb means applying
                        orb = abs(orb)  # Use positive orb for exactness check
                        
                        aspect_obj = Aspect(
                            body1=CelestialBody(aspect.p1_name.upper()),
                            body2=CelestialBody(aspect.p2_name.upper()),
                            type=aspect.aspect,
                            orb=orb,
                            exact=orb <= 1,
                            applying=is_applying
                        )
                        aspects.append(aspect_obj)
                        logger.info(f"Aspect: {aspect_obj.body1.value} {aspect_obj.type} {aspect_obj.body2.value} (Orb={aspect_obj.orb:.2f}°, Exact={aspect_obj.exact})")
                    except Exception as e:
                        logger.warning(f"Error processing aspect: {str(e)}")
                        continue
            except Exception as e:
                logger.error(f"Error calculating aspects: {str(e)}", exc_info=True)
                # Don't raise here, aspects are optional
            
            logger.info("Creating BirthChart response")
            return BirthChart(
                datetime=gmt_datetime,
                location=location,
                bodies=bodies,
                houses=houses,
                angles=angles,
                aspects=aspects
            )
        except Exception as e:
            logger.error(f"Error in calculate_birth_chart: {str(e)}", exc_info=True)
            raise 

    async def calculate_transits(
        self,
        natal_chart: BirthChart,
        date_range: DateRange,
        orb: float = 1.0
    ) -> List[Aspect]:
        """Calculate transits for a given birth chart and date range."""
        try:
            logger.info(f"Calculating transits for date range: {date_range}")
            
            # Create natal instance from birth chart data
            natal_dt = datetime(
                year=natal_chart.datetime.year,
                month=natal_chart.datetime.month,
                day=natal_chart.datetime.day,
                hour=natal_chart.datetime.hour,
                minute=natal_chart.datetime.minute,
                second=natal_chart.datetime.second or 0
            )
            
            natal_instance = AstrologicalSubject(
                name="Natal",
                year=natal_dt.year,
                month=natal_dt.month,
                day=natal_dt.day,
                hour=natal_dt.hour,
                minute=natal_dt.minute,
                lat=float(natal_chart.location.latitude),
                lng=float(natal_chart.location.longitude),
                tz_str=natal_chart.datetime.timezone
            )
            
            # Create transit instance
            transit_dt = datetime(
                year=date_range.start.year,
                month=date_range.start.month,
                day=date_range.start.day,
                hour=date_range.start.hour,
                minute=date_range.start.minute,
                second=date_range.start.second or 0
            )
            
            transit_instance = AstrologicalSubject(
                name="Transit",
                year=transit_dt.year,
                month=transit_dt.month,
                day=transit_dt.day,
                hour=transit_dt.hour,
                minute=transit_dt.minute,
                lat=float(natal_chart.location.latitude),  # Use same location as birth chart
                lng=float(natal_chart.location.longitude),
                tz_str=date_range.start.timezone
            )
            
            # Use Kerykeion's SynastryAspects for transit calculations
            active_aspects = [
                {"name": "conjunction", "orb": orb},
                {"name": "opposition", "orb": orb},
                {"name": "trine", "orb": orb},
                {"name": "sextile", "orb": orb},
                {"name": "square", "orb": orb}
            ]
            
            synastry_aspects = SynastryAspects(
                transit_instance,
                natal_instance,
                active_aspects=active_aspects
            )
            
            # Convert Kerykeion aspects to our Aspect model
            aspects = []
            for aspect in synastry_aspects.relevant_aspects:
                try:
                    # Skip invalid celestial bodies
                    if aspect.p1_name.upper() not in [b.value for b in CelestialBody] or \
                       aspect.p2_name.upper() not in [b.value for b in CelestialBody]:
                        continue
                    
                    # Skip aspects with orbs larger than our limit
                    if abs(aspect.orbit) > orb:
                        continue

                    # Ensure orb is positive
                    orb_value = abs(aspect.orbit)
                    is_applying = aspect.orbit < 0  # Negative orb means applying
                    
                    aspect_obj = Aspect(
                        body1=CelestialBody(aspect.p1_name.upper()),
                        body2=CelestialBody(aspect.p2_name.upper()),
                        type=aspect.aspect,
                        orb=orb_value,
                        exact=orb_value <= 0.1,  # Consider exact if orb <= 0.1 degrees
                        applying=is_applying
                    )
                    aspects.append(aspect_obj)
                    logger.info(f"Transit Aspect: {aspect_obj.body1.value} {aspect_obj.type} Natal {aspect_obj.body2.value} "
                              f"(Orb={aspect_obj.orb:.2f}°, Exact={aspect_obj.exact}, Applying={aspect_obj.applying})")
                except Exception as e:
                    logger.warning(f"Error processing transit aspect: {str(e)}")
                    continue
            
            return aspects
            
        except Exception as e:
            logger.error(f"Error calculating transits: {str(e)}", exc_info=True)
            raise HTTPException(status_code=500, detail=f"Error calculating transits: {str(e)}") 