import { Injectable, Logger } from '@nestjs/common';
import { EncryptionService } from '../encryption/encryption.service';
import { ApiConfig } from './api.config';
import { ExtraHeadersTypes } from './types/extra-headers';

@Injectable()
export class ApiService {
  private readonly logger: Logger;
  private readonly encryptionService: EncryptionService;
  private readonly apiConfig: ApiConfig;

  public constructor() {
    this.logger = new Logger(ApiService.name);
    this.encryptionService = new EncryptionService();
    this.apiConfig = new ApiConfig();
  }

  /**
   * Fetches data from an API endpoint.
   *
   * @param {string} path - The endpoint path.
   * @param {string} encryptedData - The encrypted data to be sent to the API.
   * @param {string} type - The type of API (default: 'infotech').
   * @param {boolean} withToken
   * @returns {Promise<object | null>} A Promise resolving to the response data from the API endpoint, or null if an error occurs.
   */
  public async fetchApi(
    path: string,
    encryptedData: string,
    type: string = 'infotech',
    withToken: boolean = true,
    extraHeadersData: any = {},
  ): Promise<object | null> {
    try {
      const baseUrl = this.getApiBaseUrl(type);
      const headers: HeadersInit = await this.getHeaders(
        withToken,
        extraHeadersData,
      );
      const body = JSON.stringify({
        str: encryptedData,
      });
      const response = await fetch(`${baseUrl}/${path}`, {
        method: 'POST',
        headers,
        body,
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
      ? this.apiConfig.infotechApiBaseUrl
      : this.apiConfig.attendanceApiBaseUrl;
  }

  /**
   * Generates and returns a set of HTTP headers for API requests.
   * This function constructs headers required for making API calls, including encrypted values
   * @param {boolean} withToken
   * @returns {Promise<HeadersInit>} - A promise that resolves to an object representing the HTTP headers.
   */
  public async getHeaders(
    withToken: boolean,
    extraHeadersData: ExtraHeadersTypes = {},
  ): Promise<HeadersInit> {
    const encryptedTrue: string = await this.encryptionService.encrypt('true');
    const mobile: string = await this.encryptionService.encrypt('Mobile');
    const userEmail: string = await this.encryptionService.encrypt(
      extraHeadersData.email,
    );
    const imei: string = await this.encryptionService.encrypt(
      extraHeadersData.imei,
    );
    let headers: HeadersInit = {
      'User-Agent': 'okhttp/4.12.0',
      'Content-Type': 'application/json; charset=UTF-8',
      isverified: encryptedTrue,
      '20y16e': mobile,
      '9p1d4r': userEmail,
      '4v9d': imei,
    };

    if (withToken) {
      const itoken: string = extraHeadersData.token;
      headers = {
        ...headers,
        isnew: encryptedTrue,
        itoken,
      };
    }
    return headers;
  }
}
