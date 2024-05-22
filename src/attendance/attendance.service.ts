import { Injectable, Logger } from '@nestjs/common';
import { GetAttendanceHistoryRequestDto } from './dto/get-attendance-history-request.dto';
import { EncryptionService } from '../encryption/encryption.service';
import { ApiService } from '../api/api.service';

@Injectable()
export class AttendanceService {
  private readonly logger: Logger = new Logger(AttendanceService.name);

  public constructor(
    protected readonly encryptionService: EncryptionService,
    protected readonly apiService: ApiService,
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
   * @returns {Promise<{status: boolean, message: string, data?: any}>} - A promise that resolves to an object containing the status, message, and data (if any).
   */
  public async getAttendanceHistory(data: GetAttendanceHistoryRequestDto) {
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
        'AttendanceHistory/GetAttendanceHistory',
        encryptedPayload,
        'attendance',
      );
      if (!historyData && historyData.data.length === 0) {
        return {
          status: false,
          message: 'No history data found.',
        };
      }

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

  public async attendanceClockIn() {}
}
