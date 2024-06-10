import {
  BadRequestException,
  HttpStatus,
  Inject,
  Injectable,
  Logger,
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
import { ResponseServiceType } from '../types/response-service';
import * as bcrypt from 'bcrypt';
import { UserLocationEnum } from '../attendance/enums/user-location.enum';
import { TimezoneCodeEnum } from '../attendance/enums/timezone-code.enum';

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
  public async getUserInformation(
    data: LoginRequestDto,
  ): Promise<ResponseServiceType> {
    try {
      let dbUserData;
      if (data.type === 'login') {
        dbUserData = await this.getUserInformationFromDb(
          data.email,
          data.appPassword,
        );
      }
      if (data.type === 'login' && dbUserData === null) {
        throw new BadRequestException('User not found in our db.');
      }
      if (data.type === 'login' && dbUserData !== null) {
        return {
          status: true,
          message: '',
          code: HttpStatus.OK,
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
        code: HttpStatus.OK,
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

    const userToken = await this.buildUserToken(
      responseData.email,
      responseData.imei,
      responseData.employeeId,
    );

    return { ...responseData, userToken };
  }

  private async buildUserToken(
    imei: string,
    email: string,
    employeeId: string,
  ) {
    const userTokenFormula = { imei, email, employeeId };
    return await this.encryptionService.encrypt(
      JSON.stringify(userTokenFormula),
    );
  }

  /**
   * Retrieves user information from database.
   *
   * @param {string} email
   * @param {string} appPassword
   * @returns A Promise resolving to an object containing the status of the operation, any message related to the operation, and the user data if successful.
   */
  public async getUserInformationFromDb(
    email: string,
    appPassword: string,
  ): Promise<any | null> {
    const cachedData = await this.cacheManager.get(
      `user-${email}-${appPassword}`,
    );
    if (cachedData) return cachedData;

    const userData = await this.prismaService.user.findUnique({
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
        managementAppPassword: true,
        userToken: true,
        companyId: true,
        createdAt: false,
        updatedAt: false,
      },
    });
    if (!userData) return null;
    const isPasswordMatch = await bcrypt.compare(
      appPassword,
      userData.managementAppPassword,
    );
    if (!isPasswordMatch) return null;

    await this.cacheManager.set(
      `user-${email}-${appPassword}`,
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
  public async storeUserInformation(
    data: UserRequestDto,
  ): Promise<ResponseServiceType> {
    try {
      const userInformation = await this.prismaService.$transaction(
        async (prisma) => {
          const encryptedAppPassword: string = await bcrypt.hash(
            data.appPassword,
            10,
          );
          const userInformation = await prisma.user.upsert({
            where: { email: data.email },
            update: {
              token: data.token,
              deviceId: data.deviceId,
              userToken: data.userToken,
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
              userToken: data.userToken,
              managementAppPassword: encryptedAppPassword,
            },
          });

          return userInformation;
        },
      );
      const timeZone: string =
        data.userGroupId == UserLocationEnum.INDONESIA
          ? TimezoneCodeEnum.INDONESIA
          : TimezoneCodeEnum.MALAYSIA;
      const createAttendanceData: any =
        await this.attendanceService.storeDataRequiredForClockIn({
          userId: userInformation.id,
          locationName: data.attendanceData.locationName,
          latitude: data.attendanceData.latitude,
          longitude: data.attendanceData.longitude,
          isActive: data.attendanceData.isActive,
          remarks: data.attendanceData.remarks,
          isSubscribeMail: data.attendanceData.isSubscribeMail,
          isImmediate: data.attendanceData.isImmediate,
          timeZone,
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
        code: HttpStatus.CREATED,
        data: { ...userInformation, attendanceData: createAttendanceData },
      };
    } catch (e) {
      const message: string = `Failed to store user information. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message,
      };
    }
  }

  /**
   * get user by the given user token from db
   * @param {string} userToken
   * @return {Promise<ResponseServiceType>}
   */
  public async getUserByToken(userToken: string): Promise<ResponseServiceType> {
    try {
      let userData = null;
      const cachedData = await this.cacheManager.get(`userdata-${userToken}`);
      userData = cachedData
        ? cachedData
        : await this.prismaService.user.findFirst({
            where: {
              userToken,
            },
          });
      if (userData === null) {
        return {
          status: false,
          message: 'User is not found.',
          code: HttpStatus.BAD_REQUEST,
        };
      }

      userData = this.exclude(userData, ['managementAppPassword']);
      await this.cacheManager.set(
        `userdata-${userToken}`,
        userData,
        Constants.ONE_HOURS,
      );
      return {
        status: true,
        code: HttpStatus.OK,
        message: '',
        data: userData,
      };
    } catch (e) {
      this.logger.log(
        `Could not get user info for token ${userToken}. Reason: ${e.message}`,
      );

      return {
        status: false,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        message: e.message,
      };
    }
  }

  /**
   * Excludes specified keys from a user object.
   *
   * This method takes a user object and an array of keys, then returns a new object
   * with the specified keys excluded from the user object.
   *
   * @param {User} user - The user object from which to exclude keys.
   * @param {string[]} keys - An array of keys to be excluded from the user object.
   * @returns {Object} A new object with the specified keys excluded.
   *
   * @example
   * const user = { id: 1, name: 'Alice', password: 'secret', email: 'alice@example.com' };
   * const keysToExclude = ['password'];
   * const result = exclude(user, keysToExclude);
   * // result: { id: 1, name: 'Alice', email: 'alice@example.com' }
   */
  private exclude(user: any, keys: string[]) {
    return Object.fromEntries(
      Object.entries(user).filter(([key]) => !keys.includes(key)),
    );
  }
}
