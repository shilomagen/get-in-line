import { HttpService } from './http';
import { EnrichedSlot, UserVisit } from '../internal-types';
import { AppointmentSetRequest } from '../api/appointment-set';
import { MockPosition } from '../consts';

export class AppointmentHandler {
  constructor(private readonly httpService: HttpService) {
  }

  setAppointment(userVisit: UserVisit, slot: EnrichedSlot) {
    const { serviceId, date, timeSinceMidnight } = slot;
    const { visitId, visitToken } = userVisit;
    const setAppointmentRequest: AppointmentSetRequest = {
      ServiceId: serviceId,
      appointmentDate: date,
      appointmentTime: timeSinceMidnight,
      position: MockPosition,
      preparedVisitId: visitId
    };

    const response = this.httpService.setAppointment(visitToken, setAppointmentRequest);
    console.log(response);
    return response;
  }

}
