import axios, { AxiosInstance, AxiosRequestConfig } from 'axios';
import { MockPosition, OrganizationID, ServiceIds } from '../consts';
import {
  SearchAvailableDatesRequest,
  SearchAvailableDatesResponse,
  SearchAvailableSlotsRequest,
  SearchAvailableSlotsResponse,
  LocationServicesRequest,
  LocationServicesResponse,
  AnswerQuestionRequest,
  PrepareVisitData,
  PrepareVisitResponse,
  AppointmentSetRequest,
  AppointmentSetResponse,
  AppointmentSetResult,
  LocationSearchResponse
} from '../api';
import { DateUtils } from '../utils';
import { EnrichedService, Location, Service } from '../internal-types';
import { toLocation, toService } from '../mappers';

const BaseURL = 'https://central.qnomy.com/CentralAPI';


export const Urls = {
  createAnonymousSession: `${BaseURL}/UserCreateAnonymous`,
  locationSearch: `${BaseURL}/LocationSearch`,
  locationServices: `${BaseURL}/LocationGetServices`,
  searchAvailableDates: `${BaseURL}/SearchAvailableDates`,
  searchAvailableSlots: `${BaseURL}/SearchAvailableSlots`,
  setAppointment: `${BaseURL}/AppointmentSet`,
  cancelAppointment: `${BaseURL}/AppointmentCancel`,
  prepareVisit: (serviceId: number) => `${BaseURL}/Service/${serviceId}/PrepareVisit`,
  answer: (visitToken: string) => `${BaseURL}/PreparedVisit/${visitToken}/Answer`

};


function requestInterceptor(config: AxiosRequestConfig, log: (...args: any[]) => void) {
  config.params['position'] = MockPosition;
  const params = JSON.stringify(config.params);
  const body = JSON.stringify(config.data);
  log(`Calling ${config.url} with params: ${params} and body ${body}`);
  return config;
}

export class HttpService {
  private readonly httpClient: AxiosInstance;

  constructor(token: string) {
    this.httpClient = axios.create({ headers: { Authorization: `JWT ${token}` } });
    console.log(`Creating instance with token: JWT ${token}`);
    this.httpClient.interceptors.request.use((config) => requestInterceptor(config, console.log));
  }

  public async getLocations(): Promise<Location[]> {
    const params = { organizationId: OrganizationID, position: MockPosition };
    const results = await this.httpClient.get<LocationSearchResponse>(Urls.locationSearch, { params }).then(res => res.data);
    return (results.Results ?? []).map(toLocation);
  }

  public async getServiceIdByLocationId(locationId: number, serviceTypeId: number = ServiceIds.BiometricPassportAppointment): Promise<Service[]> {
    const params: LocationServicesRequest = {
      locationId,
      serviceTypeId
    };
    return this.httpClient.get<LocationServicesResponse>(Urls.locationServices, { params })
      .then(res => (res.data.Results ?? []).map(toService));
  }

  public async getCalendars(serviceId: number): Promise<EnrichedService[]> {
    const params: SearchAvailableDatesRequest = {
      maxResults: 100,
      startDate: DateUtils.toApiFormattedDate(Date.now()),
      serviceId,
    };
    const result = await this.httpClient.get<SearchAvailableDatesResponse>(Urls.searchAvailableDates, { params });
    return (result.data.Results ?? []).map(result => ({ ...result, serviceId }));
  }

  public getAvailableSlotByCalendar(calendarId: number, serviceId: number): Promise<number[]> {
    const params: SearchAvailableSlotsRequest = {
      CalendarId: calendarId,
      ServiceId: serviceId,
      dayPart: 0
    };
    return this.httpClient.get<SearchAvailableSlotsResponse>(Urls.searchAvailableSlots, { params })
      .then(res => (res.data.Results ?? []).map(({ Time }) => Time));
  }

  public prepareVisit(serviceId: number): Promise<PrepareVisitData> {
    return this.httpClient.post<PrepareVisitResponse>(Urls.prepareVisit(serviceId)).then(res => res.data.Data);
  }

  public answer(answerRequest: AnswerQuestionRequest): Promise<PrepareVisitData> {
    return this.httpClient.post<PrepareVisitResponse>(Urls.answer(answerRequest.PreparedVisitToken), answerRequest)
      .then(res => res.data.Data);
  }

  public setAppointment(visitToken: string, params: AppointmentSetRequest): Promise<AppointmentSetResult | null> {
    return this.httpClient.get<AppointmentSetResponse>(Urls.setAppointment, {
      params,
      headers: {
        PreparedVisitToken: visitToken
      }
    }).then(res => res.data.Results);
  }


}
