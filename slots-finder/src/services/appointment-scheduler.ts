import { HttpService } from './http';
import { UserDomainStatus, UserDomainV2, UserService } from './user';
import {
  aFailedResponse,
  AppointmentSetterResponse,
  aSuccessResponse,
  EnrichedSlot,
  ResponseStatus,
  SetAppointmentResponse,
  UserVisitSuccessData
} from '../internal-types';
import { BaseLogger } from 'pino';
import { SessionCreator } from './session-creator';
import { LoggerMessages } from './logger';
import { AppointmentHandler } from './appointment-handler';
import { VisitPreparer } from './visit-preparer';
import { toAppointment } from '../mappers';
import { ErrorCode } from '../consts';
import { UserAppointment } from '../../appointment-setter';

export class AppointmentScheduler {
  private _httpService: HttpService | null = null;

  constructor(
    private readonly userService: UserService,
    private readonly slot: EnrichedSlot,
    private readonly logger: BaseLogger
  ) {
  }

  private get httpService(): Promise<HttpService> {
    if (this._httpService) {
      return Promise.resolve(this._httpService);
    } else {
      return this.initializeHttpService()
        .then(initializedHttpService => {
          this._httpService = initializedHttpService;
          return initializedHttpService;
        });
    }
  }

  private async initializeHttpService() {
    return SessionCreator.create().then(token => new HttpService(token));
  }

  private async setAppointmentToUser(user: UserDomainV2, userVisit: UserVisitSuccessData): Promise<SetAppointmentResponse> {
    this.logger.info({ userId: user.id }, LoggerMessages.ScheduleAppointmentStart);
    const appointmentHandler = new AppointmentHandler(await this.httpService);
    const response = await appointmentHandler.setAppointment(userVisit, this.slot);
    return response.status === ResponseStatus.Success ?
      aSuccessResponse(response.data) :
      aFailedResponse(response.data.errorCode);
  }

  async set(): Promise<AppointmentSetterResponse> {
    const { mappedCity } = this.slot;
    this.logger.info({ city: mappedCity! }, LoggerMessages.CityLookup);
    const user = await this.userService.getFirstUserByCity(mappedCity!);
    if (user) {
      this.logger.info({ user }, LoggerMessages.MarkUserUnavailable);
      await this.userService.setUserStatus(user.id, UserDomainStatus.Unavailable);
      const httpClient = await this.httpService;
      this.logger.info({}, LoggerMessages.StartVisitPrepare);
      const userVisit = await new VisitPreparer(httpClient, this.logger).prepare(user, this.slot.serviceId);
      if (userVisit.status === ResponseStatus.Success) {
        const appointment = await this.setAppointmentToUser(user, userVisit.data);
        if (appointment.status === ResponseStatus.Success) {
          const { preferredCities, userStatus, ...restUser } = user;
          const userAppointment: UserAppointment = {
            ...restUser,
            ...toAppointment(this.slot),
          };
          await this.userService.setUserStatus(user.id, UserDomainStatus.AppointmentSet)
          this.logger.info({ userAppointment }, LoggerMessages.SetAppointmentSuccess);
          return { ...aSuccessResponse(userAppointment), user };
        } else {
          const errorCode = appointment.data.errorCode;
          this.logger.info({ errorCode }, LoggerMessages.SetAppointmentError);
          return { ...aFailedResponse(errorCode), user };
        }
      } else {
        return { ...aFailedResponse(userVisit.data.errorCode), user };
      }
    }
    this.logger.info({ city: mappedCity }, LoggerMessages.UserNotFoundForCity);
    return { ...aFailedResponse(ErrorCode.NoCityFoundForUser), user: null };
  }
}
