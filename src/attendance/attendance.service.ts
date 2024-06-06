import { HttpStatus, Inject, Injectable } from '@nestjs/common';
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

@Injectable()
export class AttendanceService {
  public constructor(
    private readonly encryptionService: EncryptionService,
    private readonly apiService: ApiService,
    private readonly prismaService: PrismaService,
    private readonly apiConfig: ApiConfig,
    private readonly logger: MyLoggerService,
    private readonly bullQueueService: BullQueueService,
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
   * @param {boolean} fetchLastItem - Option to retrieve just the last item
   * @returns {Promise<{status: boolean, message: string, data?: any}>} - A promise that resolves to an object containing the status, message, and data (if any).
   */
  public async getAttendanceHistory(
    data: GetAttendanceHistoryRequestDto,
    fetchLastItem: boolean = false,
  ): Promise<object> {
    try {
      let cachedHistory: any = await this.cacheManager.get(
        `history-${data.email}`,
      );
      if (cachedHistory) {
        cachedHistory = fetchLastItem ? cachedHistory.pop() : cachedHistory;
        return {
          status: true,
          message: '',
          data: cachedHistory,
        };
      }
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
        return {
          status: false,
          message: 'No history data found.',
        };
      }

      await this.cacheManager.set(
        `history-${data.email}`,
        historyData,
        Constants.ONE_HOURS,
      );
      let responseData = historyData;
      if (fetchLastItem) responseData = historyData.pop();
      return {
        status: true,
        message: '',
        data: responseData,
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
      return null;
    }
  }

  /**
   * Get attendance data required for clock in
   */
  public async getAttendanceRequiredData(): Promise<ResponseServiceType> {
    try {
      const cachedData = await this.cacheManager.get('attendances-data');
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
        'attendances-data',
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
      this.logger.log(`${data.type} Success at: ${time}`);

      if (data.attendanceData.isSubscribeMail) {
        await this.bullQueueService.dispatchMailQueue({
          recipient: data.email,
          subject: `Sucessfully ${data.type} at ${time}`,
          body: `<p style="font-weight: bold">You have successfully ${data.type} at ${time} in ${data.attendanceData.locationName}</p>`,
        });
      }
    } catch (e) {
      this.logger.error(`Cannot ${data.type}. Reason: ${e.message}`);
      if (data.attendanceData.isSubscribeMail) {
        await this.bullQueueService.dispatchMailQueue({
          recipient: data.email,
          subject: `Failed to auto ${data.type} at the moment, please do ${data.type} manually.`,
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
    for (const attendance of this.shuffleArray(attendances.data)) {
      const delay: number = this.getDelay(
        attendance.attendanceData.isImmediate,
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
}
