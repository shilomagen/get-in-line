import { HttpService, loopWithDelay } from './http';
import { EnrichedService, EnrichedSlot, Location, Service } from '../internal-types';
import { toCalendarSlot, toEnrichedSlot } from '../mappers';
import { DateUtils } from '../utils';
import { Locations } from '../locations';
import { BaseLogger } from 'pino';
import { LoggerMessages } from './logger';
import { SendMessageCommandOutput } from '@aws-sdk/client-sqs';

export class SlotsFinder {
  constructor(
    private readonly httpService: HttpService,
    private readonly publish: (slot: EnrichedSlot) => Promise<void>,
    private readonly logger: BaseLogger) {
  }

  private async handleSlotsForCalendar(enrichedService: EnrichedService, location: Location): Promise<void> {
    const { calendarId, serviceId } = enrichedService;
    const slots = await this.httpService.getAvailableSlotByCalendar(calendarId, serviceId);
    const enrichedSlots = slots.map(slot => toCalendarSlot(enrichedService, slot)).map(s => toEnrichedSlot(s, location));
    enrichedSlots.forEach(slot => this.logger.info({ slot }, LoggerMessages.SlotsFound));
    await Promise.allSettled(enrichedSlots.map((slot) => this.publish(slot)));
  }

  private createServiceToLocationMap(services: Service[], locations: Location[]): Record<string, Location> {
    return services.reduce<Record<string, Location>>((acc, service) => {
      return {
        ...acc,
        [service.id]: locations.find(location => location.id === service.locationId)!
      };
    }, {});
  }

  private async handleCalendar(serviceId: number, maxDaysUntilAppointment: number, location: Location) {
    const calendars = await this.httpService.getCalendars(serviceId);
    const relevantCalendars = calendars.filter(({ calendarDate }) => DateUtils.isDateInDaysRange(calendarDate, maxDaysUntilAppointment));
    await loopWithDelay(relevantCalendars, (enrichedService => this.handleSlotsForCalendar(enrichedService, location)));
  }

  async find(maxDaysUntilAppointment: number): Promise<void> {
    const services = await loopWithDelay(Locations.map(({ id }) => id), (id) => this.httpService.getServiceIdByLocationId(id)).then(res => res.flat());
    const serviceIdToLocationMap = this.createServiceToLocationMap(services, Locations);
    const serviceIds = services.map(service => service.id);
    await Promise.allSettled(serviceIds.map(serviceId => this.handleCalendar(serviceId, maxDaysUntilAppointment, serviceIdToLocationMap[serviceId])));
  }
}
