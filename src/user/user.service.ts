import {
  Injectable,
  Logger,
  Inject,
  BadRequestException,
  HttpStatus,
  UnauthorizedException,
} from '@nestjs/common';
import { LoginRequestDto } from './dto/login-request.dto';
import { ApiService } from '../api/api.service';
import { EncryptionService } from '../encryption/encryption.service';
import { PrismaService } from '../prisma/prisma.service';
import { UserRequestDto } from './dto/user-request.dto';
import { ApiConfig } from '../api/api.config';
import * as NodeImei from 'node-imei';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { Constants } from '../constants';
import { AttendanceService } from '../attendance/attendance.service';

@Injectable()
export class UserService {
  private readonly logger: Logger;

  public constructor(
    protected readonly apiService: ApiService,
    protected readonly encryptionService: EncryptionService,
    protected readonly prismaService: PrismaService,
    protected readonly apiConfig: ApiConfig,
    protected readonly attendanceService: AttendanceService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
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
      let dbUserData;
      if (data.type === 'login') {
        dbUserData = await this.getUserInformationFromDb(
          data.email,
          data.employeeId.toUpperCase(),
        );
      }
      if (data.type === 'login' && dbUserData === null) {
        throw new BadRequestException('User not found in our db.');
      }
      if (data.type === 'login' && dbUserData !== null) {
        return {
          status: true,
          message: '',
          data: dbUserData,
        };
      }

      const imeiGenerator = new NodeImei();
      const imei = imeiGenerator.random();
      const payload = {
        IMEINo: imei,
        plaintext: '',
        UserEmail: data.email,
        UserPassword: data.password,
      };

      const infotechData: any =
        await this.fetchUserInformationFromInfotech(payload);
      if (infotechData === null)
        throw new UnauthorizedException('Credentials might be wrong.');
      return {
        status: true,
        message: '',
        data: infotechData,
      };
    } catch (e) {
      const message: string =
        e.status === HttpStatus.BAD_REQUEST
          ? e.message
          : `Can't fetch user information from infotech. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        message,
        code: e.status,
      };
    }
  }

  /**
   * Retrieves user information from infotech api server.
   *
   * @param data - The data object containing user request information.
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async fetchUserInformationFromInfotech(
    payload,
  ): Promise<object | null> {
    const jsonData: string = JSON.stringify(payload);
    const encryptedData = await this.encryptionService.encrypt(jsonData);
    const response: any = await this.apiService.fetchApi(
      this.apiConfig.getUserInfoPath,
      encryptedData,
      'infotech',
      false,
      {
        email: payload.UserEmail,
        imei: payload.imei,
      },
    );

    if (!response?.UserId) return null;
    if (response && response.UserId == 0) return null;
    const responseData = {
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
    employeeId: string,
  ): Promise<any | null> {
    const cachedData = await this.cacheManager.get(
      `user-${email}-${employeeId}`,
    );
    if (cachedData) return cachedData;

    const userData = await this.prismaService.user.findUnique({
      where: {
        email,
        employeeId,
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
    await this.cacheManager.set(
      `user-${email}-${employeeId}`,
      userData,
      Constants.ONE_HOURS,
    );
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
          const userInformation = await prisma.user.upsert({
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

          return userInformation;
        },
      );

      const createAttendanceData: any =
        await this.attendanceService.storeDataRequiredForClockIn({
          userId: userInformation.id,
          locationName: data.attendanceData.locationName,
          latitude: data.attendanceData.latitude,
          longitude: data.attendanceData.longitude,
          isActive: data.attendanceData.isActive,
          remarks: data.attendanceData.remarks,
          timeZone: data.attendanceData.timeZone,
        });
      if (createAttendanceData === null)
        throw new Error('Failed to store attendance data.');
      await this.cacheManager.set(
        data.email,
        userInformation,
        Constants.ONE_HOURS,
      );
      return {
        status: true,
        message: '',
        data: { ...userInformation, attendanceData: createAttendanceData },
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
