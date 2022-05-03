import { SlotsFinder } from './src/services/slots-finder';
import { SendMessageCommand, SendMessageCommandOutput, SQSClient } from '@aws-sdk/client-sqs';
import { HttpService, SessionCreator } from './src/services';
import { getLogger, withRequest } from './src/services/logger';
import { EnrichedSlot } from './src/internal-types';

const MAX_DAYS = 14;

export async function findSlots(event: any, context: any): Promise<void> {
  withRequest(event, context);
  const logger = getLogger();
  const sqsClient = new SQSClient({ region: 'eu-central-1' });
  const queueUrl = process.env.SLOTS_QUEUE_URL;
  const publisher = (slot: EnrichedSlot): Promise<SendMessageCommandOutput> => {
    return sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(slot)
    }));
  };
  const token = await SessionCreator.create();
  const httpService = new HttpService(token, false);
  const slotsFinder = new SlotsFinder(httpService, publisher, logger);
  await slotsFinder.find(MAX_DAYS);
};

