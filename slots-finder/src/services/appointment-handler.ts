import { HttpService } from './http';
import { EnrichedSlot, UserVisitSuccessData } from '../internal-types';
import {
  AppointmentSetRequest,
  AppointmentSetResponse,
  AppointmentSetResult
} from '../api/appointment-set';
import { ErrorCode, MockPosition } from '../consts';
import { getLogger, LoggerMessages } from './logger';

const logger = getLogger()
enum ErrorStrings {
  DoubleBook = 'לא ניתן לתאם תור חדש לפני ביטול התור הקיים'
}

interface SetAppointmentSuccess {
  status: 'SUCCESS';
  data: AppointmentSetResult;
}

interface SetAppointmentFailed {
  status: 'FAILED';
  data: {
    errorCode: ErrorCode;
  };
}

type SetAppointmentResponse = SetAppointmentSuccess | SetAppointmentFailed

export class AppointmentHandler {
  constructor(private readonly httpService: HttpService) {
  }

  private resolveError(response: AppointmentSetResponse): ErrorCode {
    if (response.ErrorMessage === 'General server error') {
      return ErrorCode.SetAppointmentGeneralError;
    } else if (Array.isArray(response.Messages)) {
      const errorStr = response.Messages.join('');
      if (errorStr.includes(ErrorStrings.DoubleBook)) {
        return ErrorCode.AlreadyHadAnAppointment;
      } else {
        return ErrorCode.General;
      }
    }
    return ErrorCode.General;
  }

  async setAppointment(userVisit: UserVisitSuccessData, slot: EnrichedSlot): Promise<SetAppointmentResponse> {
    const { serviceId, date, timeSinceMidnight } = slot;
    const { visitId, visitToken } = userVisit;
    const setAppointmentRequest: AppointmentSetRequest = {
      ServiceId: serviceId,
      appointmentDate: date,
      appointmentTime: timeSinceMidnight,
      position: MockPosition,
      preparedVisitId: visitId
    };

    const response = await this.httpService.setAppointment(visitToken, setAppointmentRequest);
    if (response?.Success) {
      return {
        status: 'SUCCESS',
        data: response.Results!
      };
    } else {
      logger.error({response}, LoggerMessages.ErrorSetAppointment)
      const errorCode = this.resolveError(response!);
      return {
        status: 'FAILED',
        data: {
          errorCode: errorCode
        }
      };
    }
  }

}
