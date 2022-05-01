import { HttpService } from './http';
import { EnrichedSlot, UserVisit } from '../internal-types';
import { AppointmentSetRequest } from '../api/appointment-set';
import { MockPosition } from '../consts';

export class AppointmentHandler {
  constructor(private readonly httpService: HttpService) {
  }

  async setAppointment(userVisit: UserVisit, slot: EnrichedSlot) {
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
      return response.Results;
    }
    console.log(`Could not set an appointment due to `, response?.Messages.join('\n'));
    return null;


  }

}
