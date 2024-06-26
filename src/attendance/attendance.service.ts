import {
  HttpStatus,
  Inject,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { ApiService } from '../api/api.service';
import { PrismaService } from '../prisma/prisma.service';
import { AttendanceDataRequestDto } from './dto/attendance-data-request.dto';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import { OnEvent } from '@nestjs/event-emitter';

import { ApiConfig } from '../api/api.config';
import { Constants } from '../constants';
import { UserRequestDto } from '../user/dto/user-request.dto';
import { ResponseServiceType } from '../types/response-service';
import { MyLoggerService } from '../my-logger/my-logger.service';
import { BullQueueService } from '../bull-queue/bull-queue.service';
import { UpdateStatusRequestDto } from './dto/update-status-request.dto';
import { UpdateLocationRequestDto } from './dto/update-location-request.dto';
import { Prisma } from '@prisma/client';
import { HelperService } from '../helper/helper.service';
import * as Sentry from '@sentry/node';

@Injectable()
export class AttendanceService {
  public constructor(
    private readonly encryptionService: EncryptionService,
    private readonly apiService: ApiService,
    private readonly prismaService: PrismaService,
    private readonly apiConfig: ApiConfig,
    private readonly logger: MyLoggerService,
    private readonly bullQueueService: BullQueueService,
    private readonly helperService: HelperService,
    @Inject(CACHE_MANAGER) private readonly cacheManager: Cache,
  ) {}

  /**
   * Retrieves the attendance history for a given employee.
   *
   * This function takes a request data transfer object containing the employee's ID,
   * customer ID, and company ID, constructs a payload, encrypts it, and sends it
   * to the API service to fetch the attendance history. It handles both successful
   * and error scenarios, returning an appropriate response object in either case.
   *
   * @param {GetAttendanceHistoryRequestDto} data - The request data transfer object containing employeeId, customerId, and companyId.
   * @param {boolean} fetchLastItem - Option to retrieve just the last item   * @param {GetAttendanceHistoryRequestDto} data - The request data transfer object containing employeeId, customerId, and companyId.
   * @param {number} page
   * @param {number} perPage
   * @returns {Promise<{status: boolean, message: string, data?: any}>} - A promise that resolves to an object containing the status, message, and data (if any).
   */
  public async getAttendanceHistory(
    data: GetAttendanceHistoryRequestDto,
    fetchLastItem: boolean = false,
    page = 1,
    perPage = 5,
  ): Promise<object> {
    try {
      let historyData = await this.fetchHistoryFromInfotech(data);
      if (historyData === null) {
        return {
          status: false,
          message: 'No history data found.',
        };
      }

      historyData = fetchLastItem
        ? historyData[0]
        : this.paginate(historyData, perPage, page);
      return {
        status: true,
        message: '',
        data: historyData,
      };
    } catch (e) {
      const message: string = `Can't fetch attendance history from infotech. Reason: ${e.message}`;
      this.logger.error(message);
      return {
        status: false,
        message,
      };
    }
  }

  /**
   * paginate the given array
   * @param array
   * @param pageSize
   * @param currentPage
   */
  public paginate(array: any[], pageSize: number, currentPage: number = 1) {
    const totalItems = array.length;
    const totalPages = Math.ceil(totalItems / pageSize);

    // Ensure the current page is within bounds
    currentPage = Math.max(1, Math.min(currentPage, totalPages));

    const startIndex = (currentPage - 1) * pageSize;
    const endIndex = Math.min(startIndex + pageSize, totalItems);
    const paginatedItems = array.slice(startIndex, endIndex);

    return {
      currentPage,
      totalItems,
      totalPages,
      pageSize,
      nextPage: currentPage < totalPages ? currentPage + 1 : null,
      previousPage: currentPage > 1 ? currentPage - 1 : null,
      hasPreviousPage: currentPage > 1,
      hasNextPage: currentPage < totalPages,
      items: paginatedItems,
    };
  }

  /**
   * fetch history data from infotech
   * @param data
   * @private
   */
  private async fetchHistoryFromInfotech(data: any) {
    const cachedData = await this.cacheManager.get(`history-${data.email}`);
    if (cachedData) return cachedData;

    const payload = {
      EmpCode: data.employeeId,
      CustomerID: data.customerId,
      CompanyID: data.companyId,
    };
    const payloadJson: string = JSON.stringify(payload);
    const encryptedPayload: string =
      await this.encryptionService.encrypt(payloadJson);

    const historyData: any = await this.apiService.fetchApi(
      this.apiConfig.getAttendanceHistoryPath,
      encryptedPayload,
      'attendance',
      true,
      {
        email: data.email,
        token: data.token,
        imei: data.imei,
      },
    );
    if (!historyData && historyData.data.length === 0) {
      return null;
    }
    const reversedHistoryData = historyData.reverse();
    await this.cacheManager.set(
      `history-${data.email}`,
      reversedHistoryData,
      Constants.ONE_HOURS,
    );
    return reversedHistoryData;
  }

  /**
   * Handles & stores required data for clock-in.
   *
   * @param {UserInfoCreatedEvent} attendanceData - The event payload containing user attendance data.
   * @returns {Promise<object | void>}
   *
   * @throws {Error} - Throws an error if the attendance data cannot be stored.
   *
   */
  public async storeDataRequiredForClockIn(
    attendanceData: AttendanceDataRequestDto,
  ): Promise<object | null> {
    try {
      const data = {
        locationName: attendanceData.locationName,
        latitude: attendanceData.latitude,
        longitude: attendanceData.longitude,
        isActive: attendanceData.isActive,
        remarks: attendanceData.remarks || '',
        timeZone: attendanceData.timeZone,
        isImmediate: attendanceData.isImmediate,
        isSubscribeMail: attendanceData.isSubscribeMail,
      };
      const create = await this.prismaService.attendanceData.upsert({
        where: { userId: attendanceData.userId },
        update: data,
        create: {
          userId: attendanceData.userId,
          ...data,
        },
      });

      await this.cacheManager.del('attendances-data');
      return create;
    } catch (e) {
      this.logger.error(`Cannot store attendance data. Reason: ${e.message}`);
      throw new Error(e.message);
    }
  }

  /**
   * Get attendance data required for clock in
   */
  public async getAttendanceRequiredData(): Promise<ResponseServiceType> {
    try {
      const cachedData = await this.cacheManager.get(`attendances-data`);
      if (cachedData) {
        return {
          status: true,
          message: '',
          code: HttpStatus.OK,
          data: cachedData,
        };
      }
      const data = await this.prismaService.user.findMany({
        include: {
          attendanceData: {
            where: { isActive: 1 },
          },
        },
      });

      await this.cacheManager.set(
        `attendances-data`,
        data,
        Constants.TWENTY_FOUR_HOURS,
      );

      return {
        status: true,
        message: '',
        code: HttpStatus.OK,
        data,
      };
    } catch (e) {
      const message: string = `Can't get attendance data. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        message,
        code: HttpStatus.INTERNAL_SERVER_ERROR,
        data: null,
      };
    }
  }

  /**
   * This method will send clock in request to infotech attendance server
   */
  @OnEvent('autoClockIn:dispatch')
  public async attendanceClockIn(data: UserRequestDto) {
    try {
      const payload = {
        CardNoC: data.idNumber,
        CustomerID: data.customerId,
        Deviceid: data.deviceId,
        IMEINo: data.imei,
        LatN: data.attendanceData.latitude,
        LngN: data.attendanceData.longitude,
        LocationNameC: data.attendanceData.locationName,
        remarks: data.attendanceData.remarks,
        timeZoneName: data.attendanceData.timeZone,
        IsException: false,
        language: 'english',
        PunchAction: 'IN',
        JobCode: '',
        NRICNo: '',
        Temperature: '',
        VerifyType: '',
        WIFISSID: '',
      };

      const jsonPayload = JSON.stringify(payload);
      const encryptedPayload =
        await this.encryptionService.encrypt(jsonPayload);
      await this.apiService.fetchApi(
        this.apiConfig.clockinPath,
        encryptedPayload,
        'attendance',
        true,
        {
          token: data.token,
          email: data.email,
          imei: data.imei,
        },
      );

      const date = new Date();
      const time = `${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
      await this.cacheManager.del(`history-${data.email}`);
      this.logger.log(
        `${data.type} Success for user: ${data.email} at: ${time}`,
      );

      if (data.attendanceData.isSubscribeMail) {
        await this.bullQueueService.dispatchMailQueue({
          recipient: data.email,
          subject: `Sucessfully ${data.type} at ${time}`,
          body: `<p style="font-weight: bold">You have successfully ${data.type} at ${time} in ${data.attendanceData.locationName}</p>`,
        });
      }
    } catch (e) {
      const message = `Failed to auto ${data.type} at the moment for user: ${data.email}, please do ${data.type} manually.`;
      this.logger.error(`${message}. Reason: ${e.message}`);
      Sentry.captureException(e);
      if (data.attendanceData.isSubscribeMail) {
        await this.bullQueueService.dispatchMailQueue({
          recipient: data.email,
          subject: message,
          body: `<p>We cannot perfrom ${data.type} at the moment. Please report this to the developer</p>`,
        });
      }
    }
  }

  /**
   * Dispatch job for clock in/out
   * @param {string} type
   */
  public async dispatchClockInOrClockOutJob(type: string): Promise<void> {
    const attendances = await this.getAttendanceRequiredData();
    for (const attendance of attendances.data) {
      const delay: number = this.getDelay(
        attendance.attendanceData?.isImmediate ?? 1,
      );

      this.logger.log(`${type} in ${delay / 1000}s for ${attendance.email}`);
      await this.bullQueueService.dispatchAutoClockInQueue(
        {
          ...attendance,
          type,
        },
        { delay },
      );
    }
  }

  /**
   * Retrieves the location history based on the provided attendance history request data.
   *
   * @param {GetAttendanceHistoryRequestDto} data - The data transfer object containing the necessary information to fetch the attendance history.
   * @returns {Promise<{status: boolean, code: number, message: string, data?: Array<{id: number, locationName: string, latitude: number, longitude: number}>}>}
   * An object containing the status, HTTP status code, message, and an optional data array with location history.
   *
   * @throws {NotFoundException} If no attendance history is found.
   */
  public async getLocationHistory(data: GetAttendanceHistoryRequestDto) {
    try {
      const history = await this.fetchHistoryFromInfotech(data);

      if (!history || history?.length === 0) {
        throw new NotFoundException('No attendance history found');
      }

      const locationHistory = history
        .reduce((acc, current) => {
          if (
            !acc.some((obj) => obj.LocationNameC === current.LocationNameC) &&
            current.LocationNameC.length > 0
          ) {
            acc.push(current);
          }
          return acc;
        }, [])
        .map((items, idx) => {
          return {
            id: idx + 1,
            locationName: items.LocationNameC,
            latitude: items.LatN,
            longitude: items.LngN,
          };
        });

      return {
        status: true,
        code: HttpStatus.OK,
        message: '',
        data: locationHistory,
      };
    } catch (e) {
      const message = `Can't fetch location history for user: ${data.email}, reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        code: e.code || e.status,
        message,
      };
    }
  }

  /**
   * Shuffles an array of objects in place using the Fisher-Yates algorithm.
   *
   * @param {object[]} items - The array of objects to shuffle.
   * @returns {object[]} The shuffled array of objects.
   */
  private shuffleArray(items: object[]): any {
    for (let i = items.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [items[i], items[j]] = [items[j], items[i]];
    }
    return items;
  }

  /**
   * Get random delay for clock in/out
   * @param isImmediate
   * @private
   */
  private getDelay(isImmediate): number {
    // get random number to randomize delay
    const randomNumber = Math.floor(Math.random() * 15) + 1;

    if (isImmediate == 1) {
      return (
        Math.floor(Math.random() * Constants.TEN_SECONDS) + Constants.ONE_SECOND
      );
    }
    // get random delay for clock in/clock out
    return (
      Math.floor(Math.random() * Constants.FIVE_TEEN_MINUTES) +
      Constants.FIVE_SECONDS * randomNumber
    );
  }

  public async updateAttendanceStatus(
    data: UpdateStatusRequestDto,
  ): Promise<ResponseServiceType> {
    try {
      const attendance = await this.prismaService.attendanceData.count({
        where: { userId: data.userId },
      });

      if (attendance === 0)
        throw new NotFoundException(
          `User attendance data for userId: ${data.userId} does not exist`,
        );

      const isActive = data.status === 'enable' ? 1 : 0;
      await this.prismaService.attendanceData.update({
        where: { userId: data.userId },
        data: {
          isActive,
        },
      });

      const messageType = isActive ? 'Enabled' : 'Disabled';
      let userData = await this.prismaService.user.findUnique({
        where: { id: data.userId },
        include: {
          attendanceData: true,
        },
      });

      userData = this.helperService.excludeField(userData, [
        'managementAppPassword',
      ]);
      return {
        status: true,
        code: HttpStatus.OK,
        message: `Auto attendance has been ${messageType}.`,
        data: userData,
      };
    } catch (e) {
      const messageType = data.status === 'enable' ? 'Enable' : 'Disable';
      const message = `Failed to ${messageType} auto attendance for userId: ${data.userId}. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        code: e.code || e.status,
        message,
      };
    }
  }

  public async updateAttendanceLocation(
    data: UpdateLocationRequestDto,
  ): Promise<ResponseServiceType> {
    try {
      const attendance = await this.prismaService.attendanceData.count({
        where: { userId: data.userId },
      });
      if (attendance === 0)
        throw new NotFoundException(
          `User attendance data for userId: ${data.userId} does not exist`,
        );

      let updateData: Prisma.AttendanceDataUpdateInput = {
        locationName: data.locationName,
        longitude: data.longitude,
        latitude: data.latitude,
      };
      if (data.timeZone !== null || data?.timeZone.length > 0) {
        updateData = {
          ...updateData,
          timeZone: data.timeZone,
        };
      }

      await this.prismaService.attendanceData.update({
        where: { userId: data.userId },
        data: updateData,
      });

      let userData = await this.prismaService.user.findUnique({
        where: { id: data.userId },
        include: {
          attendanceData: true,
        },
      });

      userData = this.helperService.excludeField(userData, [
        'managementAppPassword',
      ]);
      return {
        status: true,
        code: HttpStatus.OK,
        message: 'Location has been updated.',
        data: userData,
      };
    } catch (e) {
      const message = `Failed to update attendance location for userId: ${data.userId}. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        code: e.code || e.status,
        message,
      };
    }
  }
}
