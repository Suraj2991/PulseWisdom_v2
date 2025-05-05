import axios, { AxiosInstance } from 'axios';
import { IEphemerisClient
  , EphemerisRequest
  , AspectResponse
  , HouseResponse
  , CelestialBody } from '../../ephemeris';

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

  async calculatePositions(request: EphemerisRequest): Promise<CelestialBody[]> {
    const response = await this.client.post('/positions', {
      date: request.date,
      position: request.position
    });

    return response.data;
  }

  async calculateAspects(positions: CelestialBody[]): Promise<AspectResponse[]> {
    const response = await this.client.post('/aspects', { positions });
    return response.data;
  }

  async calculateHouses(request: EphemerisRequest): Promise<HouseResponse[]> {
    const response = await this.client.post('/houses', {
      date: request.date,
      position: request.position
    });
    return response.data;
  }
} 