import { ErrorCode } from './consts';
import { AppointmentSetResult } from './api';

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

interface UserVisitSuccess {
  status: 'SUCCESS';
  data: UserVisitSuccessData;
}

interface UserVisitFailed {
  status: 'FAILED';
  data: {
    errorCode: ErrorCode;
  };
}

export type UserVisitResponse = UserVisitSuccess | UserVisitFailed;

interface InternalSetAppointmentSuccess {
  status: 'SUCCESS';
  data: AppointmentSetResult;
}

interface InternalSetAppointmentFailed {
  status: 'FAILED',
  data: {
    errorCode: ErrorCode
  }
}

export type InternalSetAppointmentResponse =
  InternalSetAppointmentSuccess
  | InternalSetAppointmentFailed

export interface Appointment {
  hour: string;
  date: string;
  city: string;
  address: string;
  branchName: string;
}
