import { Injectable } from '@nestjs/common';
import * as CryptoJS from 'crypto-js';
import { MyLoggerService } from '../my-logger/my-logger.service';

@Injectable()
export class EncryptionService {
  private readonly initVectorKey: string;
  private readonly secretKey: string;

  public constructor(private readonly logger: MyLoggerService = null) {
    this.initVectorKey = process.env.INIT_VECTOR_KEY;
    this.secretKey = process.env.SECRET_KEY;
  }

  /**
   * Decrypts a base64-encoded string using AES encryption in CBC mode with PKCS7 padding.
   *
   * This method expects the input data to be a base64-encoded string. It uses the instance's
   * initialization vector and secret key to perform the decryption. If the decryption process
   * is successful, it returns the decrypted string. In case of an error, it logs the error
   * and returns null.
   *
   * @param {string} data - The base64-encoded string to be decrypted.
   * @returns {string | null} - the decrypted data
   *
   * @throws Will log an error message if decryption fails.
   *
   * @example
   * // Assuming `decrypt` is a method of an instantiated service class with `initVectorKey` and `secretKey` properly set:
   * const encryptedData = 'U2FsdGVkX1+Z5tI3UZm1y0==';
   * const decryptedData = await service.decrypt(encryptedData);
   * console.log(decryptedData); // Outputs the decrypted string if successful, or null if there was an error.
   */
  public decryptSync(data: string): string | null {
    try {
      const decode = CryptoJS.enc.Base64.parse(data);
      const ivParameterSpec = CryptoJS.enc.Utf8.parse(this.initVectorKey);
      const secretKeySpec = CryptoJS.enc.Utf8.parse(this.secretKey);
      const instance = CryptoJS.AES.decrypt(
        { ciphertext: decode },
        secretKeySpec,
        {
          iv: ivParameterSpec,
          padding: CryptoJS.pad.Pkcs7,
          mode: CryptoJS.mode.CBC,
        },
      );
      return instance.toString(CryptoJS.enc.Utf8);
    } catch (e) {
      console.error(e.message);
      if (this.logger !== null) {
        this.logger.error(e.message);
      }
      return null;
    }
  }

  /**
   * Encrypts a string using AES encryption in CBC mode with PKCS7 padding.
   *
   * This method takes a plain text string as input and encrypts it using the instance's
   * initialization vector and secret key. The resulting encrypted data is returned as
   * a base64-encoded string. If an error occurs during the encryption process, it logs
   * the error and returns null.
   *
   * @param {string} data - The plain text string to be encrypted.
   * @returns {Promise<string | null>} - A promise that resolves to a base64-encoded encrypted string if successful, or null if an error occurs.
   *
   * @throws Will log an error message if encryption fails.
   *
   * @example
   * // Assuming `encrypt` is a method of an instantiated service class with `initVectorKey` and `secretKey` properly set:
   * const plainText = 'Hello, World!';
   * const encryptedData = await service.encrypt(plainText);
   * console.log(encryptedData); // Outputs the base64-encoded encrypted string if successful, or null if there was an error.
   */
  public async encrypt(data: string): Promise<string | null> {
    return this.encryptSync(data);
  }

  /**
   * Encrypt data asynchronously
   * @return {Promise<string | null>}
   */
  public encryptSync(data: string) {
    try {
      const ivParameterSpec = CryptoJS.enc.Utf8.parse(this.initVectorKey);
      const secretKeySpec = CryptoJS.enc.Utf8.parse(this.secretKey);
      const encrypted = CryptoJS.AES.encrypt(data, secretKeySpec, {
        iv: ivParameterSpec,
        padding: CryptoJS.pad.Pkcs7,
        mode: CryptoJS.mode.CBC,
      });
      return encrypted.toString();
    } catch (e) {
      console.error(e.message);
      if (this.logger !== null) {
        this.logger.error(e.message);
      }
      return null;
    }
  }

  /**
   * Decrypt data asynchronously
   * @return {Promise<string | null>}
   */
  public async decrypt(data: string): Promise<string | null> {
    return this.decryptSync(data);
  }
}
