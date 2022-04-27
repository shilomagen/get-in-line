import { CalendarSlot, EnrichedSlot, Location } from '../internal-types';

export function toEnrichedSlot(calendarSlot: CalendarSlot, location: Location): EnrichedSlot {
  return {
    serviceId: calendarSlot.serviceId,
    timeSinceMidnight: calendarSlot.timeSinceMidnight,
    date: calendarSlot.date,
    address: location.address,
    branchName: location.name,
    city: location.city,
  };
}
