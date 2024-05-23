import { Injectable, Logger } from '@nestjs/common';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { ApiService } from '../api/api.service';
import { PrismaService } from '../prisma/prisma.service';
import { OnEvent } from '@nestjs/event-emitter';
import { UserInfoCreatedEvent } from '../user/events/user-info-created-event';
import { AttendanceDataRequestDto } from './dto/attendance-data-request.dto';
import { UserRequestDto } from '../user/dto/user-request.dto';
import { ApiConfig } from '../api/api.config';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger = new Logger(AttendanceService.name);

  public constructor(
    protected readonly encryptionService: EncryptionService,
    protected readonly apiService: ApiService,
    protected readonly prismaService: PrismaService,
    protected readonly apiConfig: ApiConfig,
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
      );
      if (!historyData && historyData.data.length === 0) {
        return {
          status: false,
          message: 'No history data found.',
        };
      }

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
   * Handles the 'userInfo:created' event and stores required data for clock-in.
   *
   * @param {UserInfoCreatedEvent} event - The event payload containing user attendance data.
   * @returns {Promise<void>}
   *
   * @throws {Error} - Throws an error if the attendance data cannot be stored.
   *
   */
  @OnEvent('userInfo:created')
  public async storeDataRequiredForClockIn(
    event: UserInfoCreatedEvent,
  ): Promise<void> {
    try {
      const data: AttendanceDataRequestDto = {
        userId: event.attendanceData.userId,
        locationName: event.attendanceData.locationName,
        latitude: event.attendanceData.latitude,
        longitude: event.attendanceData.longitude,
        isActive: event.attendanceData.isActive,
        remarks: event.attendanceData.remarks || '',
        timeZone: event.attendanceData.timeZone,
      };
      await this.prismaService.attendanceData.upsert({
        where: { userId: event.attendanceData.userId },
        update: data,
        create: {
          userId: event.attendanceData.userId,
          ...data,
        },
      });
    } catch (e) {
      this.logger.error(`Cannot store attendance data. Reason: ${e.message}`);
    }
  }

  /**
   * Get attendance data required for clock in
   */
  public async getAttendanceRequiredData() {
    try {
      const data = await this.prismaService.user.findMany({
        include: {
          attendanceData: {
            where: { isActive: true },
          },
        },
      });

      return {
        status: true,
        message: '',
        data,
      };
    } catch (e) {
      const message: string = `Can't get attendance data. Reason: ${e.message}`;
      this.logger.error(message);

      return {
        status: false,
        message,
        data: null,
      };
    }
  }

  /**
   * This method will send clock in request to infotech attendance server
   */
  public async attendanceClockIn(data: UserRequestDto) {
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
    const encryptedPayload = await this.encryptionService.encrypt(jsonPayload);

    try {
      await this.apiService.fetchApi(
        this.apiConfig.clockinPath,
        encryptedPayload,
        'attendance',
        true,
      );
    } catch (e) {
      this.logger.error(`Cannot clock in. Reason: ${e.message}`);
    }
  }
}
