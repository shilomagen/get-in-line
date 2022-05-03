import { HttpService, loopWithDelay } from './http';
import { CalendarSlot, EnrichedService, EnrichedSlot, Location, Service } from '../internal-types';
import { toCalendarSlot, toEnrichedSlot } from '../mappers';
import { DateUtils } from '../utils';
import { Locations } from '../locations';

export class SlotsFinder {
  constructor(private readonly httpService: HttpService) {
  }

  private async handleSlotsForCalendar(enrichedService: EnrichedService): Promise<CalendarSlot[]> {
    const { calendarId, serviceId } = enrichedService;
    const slots = await this.httpService.getAvailableSlotByCalendar(calendarId, serviceId);
    return slots.map(slot => toCalendarSlot(enrichedService, slot));
  }

  private createServiceToLocationMap(services: Service[], locations: Location[]): Record<string, Location> {
    return services.reduce<Record<string, Location>>((acc, service) => {
      return {
        ...acc,
        [service.id]: locations.find(location => location.id === service.locationId)!
      };
    }, {});
  }

  async find(maxDaysUntilAppointment: number): Promise<EnrichedSlot[]> {
    const services = await loopWithDelay(Locations.map(({ id }) => id), (id) => this.httpService.getServiceIdByLocationId(id)).then(res => res.flat());
    const serviceIdToLocationMap = this.createServiceToLocationMap(services, Locations);
    const serviceIds = services.map(service => service.id);
    const calendars = await loopWithDelay(serviceIds, (serviceId) => this.httpService.getCalendars(serviceId))
    const relevantCalendars = calendars.flat().filter(({ calendarDate }) => DateUtils.isDateInDaysRange(calendarDate, maxDaysUntilAppointment));
    const slots = await loopWithDelay(relevantCalendars, (enrichedService => this.handleSlotsForCalendar(enrichedService))).then(res=> res.flat())
    return slots.map(slot => toEnrichedSlot(slot, serviceIdToLocationMap[slot.serviceId]));
  }
}
