import { Injectable, Logger } from '@nestjs/common';

@Injectable()
export class ApiService {
  private readonly attendanceApiBaseUrl: string;
  private readonly infotechApiBaseUrl: string;
  private readonly logger: Logger;

  public constructor() {
    this.attendanceApiBaseUrl = process.env.ATTENDANCE_API_BASE_URL;
    this.infotechApiBaseUrl = process.env.INFOTECH_API_BASE_URL;
    this.logger = new Logger(ApiService.name);
  }

  /**
   * Fetches data from an API endpoint.
   *
   * @param {string} path - The endpoint path.
   * @param {string} encryptedData - The encrypted data to be sent to the API.
   * @param {string} type - The type of API (default: 'infotech').
   * @returns {Promise<object | null>} A Promise resolving to the response data from the API endpoint, or null if an error occurs.
   */
  public async fetchApi(
    path: string,
    encryptedData: string,
    type: string = 'infotech',
  ): Promise<object | null> {
    try {
      const baseUrl = this.getApiBaseUrl(type);
      const response = await fetch(`${baseUrl}/${path}`, {
        method: 'POST',
        body: JSON.stringify({
          str: encryptedData,
        }),
      });
      return response.json();
    } catch (e) {
      const message: string = `Can't fetch api for ${path}. Reason: ${e.message}`;
      this.logger.error(message);

      return null;
    }
  }

  /**
   * Get api base url.
   * @param {string} type - The type of API (default: 'infotech').
   * @returns {string} api base url
   */
  public getApiBaseUrl(type: string = 'infotech') {
    return type.toLowerCase() === 'infotech'
      ? this.infotechApiBaseUrl
      : this.attendanceApiBaseUrl;
  }
}
