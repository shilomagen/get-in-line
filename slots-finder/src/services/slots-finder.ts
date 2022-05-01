import { HttpService } from './http';
import { CalendarSlot, EnrichedService, EnrichedSlot, Location, Service } from '../internal-types';
import { toCalendarSlot, toEnrichedSlot } from '../mappers';
import { DateUtils } from '../utils';

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
    const locations = await this.httpService.getLocations();
    const services = await Promise.all(locations.map(location => this.httpService.getServiceIdByLocationId(location.id))).then(res => res.flat());
    const serviceIdToLocationMap = this.createServiceToLocationMap(services, locations);
    const serviceIds = services.map(service => service.id);
    const calendars = await Promise.allSettled(serviceIds.map(serviceId => this.httpService.getCalendars(serviceId)))
      .then(responses => responses
        .filter(res => res.status === 'fulfilled')
        .map(res => (res as PromiseFulfilledResult<EnrichedService[]>).value));
    const relevantCalendars = calendars.flat().filter(({ calendarDate }) => DateUtils.isDateInDaysRange(calendarDate, maxDaysUntilAppointment));
    const slots = await Promise.all(relevantCalendars.map(enrichedService => this.handleSlotsForCalendar(enrichedService))).then(res => res.flat());
    return slots.map(slot => toEnrichedSlot(slot, serviceIdToLocationMap[slot.serviceId]));
  }
}
