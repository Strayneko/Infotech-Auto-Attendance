import { Injectable, Logger } from '@nestjs/common';
import { UserRequestDto } from './dto/user-request.dto';
import { ApiService } from '../api/api.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { StoreUserRequestDto } from './dto/store-user-request.dto';

@Injectable()
export class UserService {
  private readonly logger: Logger;

  public constructor(
    protected readonly apiService: ApiService,
    protected readonly encryptionService: EncryptionService,
    protected readonly prismaService: PrismaService,
  ) {
    this.logger = new Logger(UserService.name);
  }

  /**
   * Retrieves user information from infotech api server.
   *
   * @param data - The data object containing user request information.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async getUserInformation(data: UserRequestDto): Promise<object> {
    try {
      const jsonData: string = JSON.stringify(data);
      const encryptedData = await this.encryptionService.encrypt(jsonData);
      const response: any = await this.apiService.fetchApi(
        'user/getUserInfo',
        encryptedData,
        'infotech',
      );

      const responseData: StoreUserRequestDto = {
        token: response.IToken,
        email: data.email,
        imei: data.imei,
        customerId: response.UserAuthorization.Customer.CustomerId,
        idNumber: response.IDNumber,
      };

      return {
        status: true,
        message: '',
        data: responseData,
      };
    } catch (e) {
      const message: string = `Can't fetch user information from infotech. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        message,
      };
    }
  }

  /**
   * Stores user information to database.
   *
   * @param data - The data object containing user information to store.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user information if successful.
   */
  public async storeUserInformation(
    data: StoreUserRequestDto,
  ): Promise<object> {
    try {
      const storeData: StoreUserRequestDto = {
        email: data.email,
        imei: data.imei,
        customerId: data.customerId,
        token: data.token,
        idNumber: data.idNumber,
        deviceId: data.deviceId,
      };

      const userInformation: StoreUserRequestDto =
        await this.prismaService.user.upsert({
          where: { email: data.email },
          update: {
            token: data.token,
            deviceId: data.deviceId,
          },
          create: storeData,
        });

      return {
        status: true,
        message: '',
        userInformation,
      };
    } catch (e) {
      const message: string = `Failed to store user information. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        message,
      };
    }
  }
}
