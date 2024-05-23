import { Injectable, Logger } from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { ApiService } from '../api/api.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRequestDto } from './dto/user-request.dto';
import { EventEmitter2 } from '@nestjs/event-emitter';
import { UserInfoCreatedEvent } from './events/user-info-created-event';

@Injectable()
export class UserService {
  private readonly logger: Logger;

  public constructor(
    protected readonly apiService: ApiService,
    protected readonly encryptionService: EncryptionService,
    protected readonly prismaService: PrismaService,
    protected readonly eventEmitter: EventEmitter2,
  ) {
    this.logger = new Logger(UserService.name);
  }

  /**
   * Retrieves user information from infotech api server or database.
   *
   * @param data - The data object containing user request information.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async getUserInformation(data: LoginRequestDto): Promise<object> {
    try {
      const dbUserData = await this.getUserInformationFromDb(data.email);
      if (dbUserData !== null) {
        return {
          status: true,
          message: '',
          data: dbUserData,
        };
      }

      const payload = {
        IMEINo: data.imei,
        plaintext: '',
        UserEmail: data.email,
        UserPassword: data.password,
      };

      const infotechData = await this.fetchUserInformationFromInfotech(payload);
      return {
        status: true,
        message: '',
        data: infotechData,
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
   * Retrieves user information from infotech api server.
   *
   * @param data - The data object containing user request information.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async fetchUserInformationFromInfotech(payload): Promise<object> {
    const jsonData: string = JSON.stringify(payload);
    const encryptedData = await this.encryptionService.encrypt(jsonData);
    const response: any = await this.apiService.fetchApi(
      'Login',
      encryptedData,
      'infotech',
      false,
    );

    const responseData: UserRequestDto = {
      token: response.IToken,
      email: payload.UserEmail,
      imei: payload.IMEINo,
      deviceId: payload.IMEINo,
      customerId: response.UserAuthorization.Customer.CustomerId,
      idNumber: response.IDNumber,
      employeeId: response.UserAuthorization.EmpCode,
      companyId: response.UserAuthorization.CompanyId,
      infotechUserId: response.UserAuthorization.UserId,
    };

    return responseData;
  }

  /**
   * Retrieves user information from database.
   *
   * @param data - The data object containing user request information.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async getUserInformationFromDb(
    email: string,
  ): Promise<UserRequestDto | null> {
    const userData = this.prismaService.user.findUnique({
      where: {
        email,
      },
      select: {
        id: false,
        userGroupId: true,
        email: true,
        token: true,
        imei: true,
        deviceId: true,
        customerId: true,
        idNumber: true,
        employeeId: true,
        infotechUserId: true,
        companyId: true,
        createdAt: false,
        updatedAt: false,
      },
    });
    if (!userData) return null;
    return userData;
  }

  /**
   * Stores user information to database.
   *
   * @param data - The data object containing user information to store.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user information if successful.
   */
  public async storeUserInformation(data: UserRequestDto): Promise<object> {
    try {
      const userInformation = await this.prismaService.$transaction(
        async (prisma) => {
          const userInformation: UserRequestDto = await prisma.user.upsert({
            where: { email: data.email },
            update: {
              token: data.token,
              deviceId: data.deviceId,
            },
            create: {
              email: data.email,
              imei: data.imei,
              customerId: data.customerId,
              token: data.token,
              idNumber: data.idNumber,
              deviceId: data.imei,
              userGroupId: data.userGroupId,
              employeeId: data.employeeId,
              companyId: data.companyId,
              infotechUserId: data.infotechUserId,
            },
          });
          const userInfoCreatedEvent = new UserInfoCreatedEvent();
          userInfoCreatedEvent.attendanceData = {
            userId: userInformation.id,
            locationName: data.attendanceData.locationName,
            latitude: data.attendanceData.latitude,
            longitude: data.attendanceData.longitude,
            isActive: data.attendanceData.isActive,
            remarks: data.attendanceData.remarks,
            timeZone: data.attendanceData.timeZone,
          };
          this.eventEmitter.emit('userInfo:created', userInfoCreatedEvent);

          return {
            ...userInformation,
            ...userInfoCreatedEvent,
          };
        },
      );
      return {
        status: true,
        message: '',
        data: userInformation,
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
