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
}

export interface User {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
}

export interface UserVisit extends User {
  visitId: number;
  visitToken: string;
}

export interface Appointment {
  hour: string;
  date: string;
  city: string;
  address: string;
  branchName: string;
}
