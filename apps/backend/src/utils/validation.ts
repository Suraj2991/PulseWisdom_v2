/**
 * Validates a latitude value
 * @param latitude The latitude to validate
 * @returns boolean indicating if the latitude is valid
 */
export function validateLatitude(latitude: number): boolean {
  if (typeof latitude !== 'number' || isNaN(latitude)) return false;
  return latitude >= -90 && latitude <= 90;
}

/**
 * Validates a longitude value
 * @param longitude The longitude to validate
 * @returns boolean indicating if the longitude is valid
 */
export function validateLongitude(longitude: number): boolean {
  if (typeof longitude !== 'number' || isNaN(longitude)) return false;
  return longitude >= -180 && longitude <= 180;
} 