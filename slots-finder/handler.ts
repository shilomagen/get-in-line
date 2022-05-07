import { SlotsFinder } from './src/services/slots-finder';
import { SendMessageCommand, SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs';
import { HttpService, SessionCreator } from './src/services';
import { getLogger, withRequest } from './src/services/logger';
import { EnrichedSlot } from './src/internal-types';
import { Publisher } from './src/services/publisher';

const MAX_DAYS = 14;

export async function findSlots(event: any, context: any): Promise<void> {
  withRequest(event, context);
  const logger = getLogger();
  const publisher = new Publisher();
  const publish = (slot: EnrichedSlot) => publisher.publishToAppointmentSetter(slot)
  const token = await SessionCreator.create();
  const httpService = new HttpService(token, false);
  const slotsFinder = new SlotsFinder(httpService, publish, logger);
  await slotsFinder.find(MAX_DAYS);
};

