import { ErrorCode } from './consts';
import { AppointmentSetResult, PrepareVisitData } from './api';
import { UserDomainV2 } from './services/user';
import { UserAppointment } from '../appointment-setter';

export interface CalendarSlot {
  date: string;
  timeSinceMidnight: number;
  serviceId: number;
}

export interface EnrichedService {
  serviceId: number;
  calendarDate: string;
  calendarId: number;
}

export interface Location {
  id: number;
  city: string;
  name: string;
  description: string;
  address: string;
}

export interface Service {
  id: number;
  name: string;
  description: string;
  locationId: number;
}

export interface EnrichedSlot {
  serviceId: number;
  date: string;
  timeSinceMidnight: number;
  city: string;
  address: string;
  branchName: string;
  mappedCity: string | undefined;
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UserVisitSuccessData {
  visitId: number;
  visitToken: string;
  user: User;
}

export interface Appointment {
  hour: string;
  date: string;
  city: string;
  address: string;
  branchName: string;
}

export enum ResponseStatus {
  Success = 'Success',
  Failed = 'Failed'
}

export interface ResponseSuccess<T> {
  status: ResponseStatus.Success,
  data: T
}

export interface ResponseFailed {
  status: ResponseStatus.Failed,
  data: {
    errorCode: ErrorCode
  }
}

export type ResponseWrapper<T> = ResponseSuccess<T> | ResponseFailed;

export type InternalSetAppointmentResponse = ResponseWrapper<AppointmentSetResult>

export type UserVisitResponse = ResponseWrapper<UserVisitSuccessData>

export type SetAppointmentResponse = ResponseWrapper<AppointmentSetResult>;

export type AppointmentSetterResponse = ResponseWrapperWithUser<UserAppointment>;

export type PrepareVisitResponse = ResponseWrapper<PrepareVisitData>;

export type ResponseWrapperWithUser<T> = ResponseWrapper<T> & { user: UserDomainV2 | null };



export const aFailedResponse = (errorCode: ErrorCode): ResponseFailed => ({
  status: ResponseStatus.Failed,
  data: {
    errorCode
  }
});

export const aSuccessResponse = <T>(data: T): ResponseSuccess<T> => ({
  status: ResponseStatus.Success,
  data,
});
