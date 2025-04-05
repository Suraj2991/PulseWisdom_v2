import axios, { AxiosInstance } from 'axios';
import { IEphemerisClient, EphemerisRequest, CelestialBody } from '../../domain/ports/IEphemerisClient';

export class EphemerisClient implements IEphemerisClient {
  private client: AxiosInstance;

  constructor(baseURL: string, apiKey: string) {
    this.client = axios.create({
      baseURL,
      headers: {
        'Authorization': `Bearer ${apiKey}`,
        'Content-Type': 'application/json'
      }
    });
  }

  async calculatePositions(request: EphemerisRequest): Promise<CelestialBody> {
    const response = await this.client.post('/positions', {
      date: request.date.toISOString(),
      latitude: request.latitude,
      longitude: request.longitude,
      altitude: request.altitude || 0,
      bodies: request.bodies || ['sun', 'moon', 'mercury', 'venus', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune', 'pluto']
    });

    return response.data;
  }

  async calculateAspects(positions: CelestialBody): Promise<any> {
    const response = await this.client.post('/aspects', { positions });
    return response.data;
  }

  async calculateHouses(request: EphemerisRequest): Promise<any> {
    const response = await this.client.post('/houses', {
      date: request.date.toISOString(),
      latitude: request.latitude,
      longitude: request.longitude,
      altitude: request.altitude || 0
    });
    return response.data;
  }
} 