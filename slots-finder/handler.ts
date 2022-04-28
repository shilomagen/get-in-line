import { SlotsFinder } from './src/slots-finder';
import { HttpService, SessionCreator } from 'get-in-line-shared/dist';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';

const MAX_DAYS = 7;
export const run = async (_event: any, _context: any) => {
  const token = await SessionCreator.create();
  const httpService = new HttpService(token);
  const slotsFinder = new SlotsFinder(httpService);
  const sqsClient = new SQSClient({ region: 'eu-central-1' });
  const queueUrl = process.env.QUEUE_URL;
  const slots = await slotsFinder.find(MAX_DAYS);

  const publishes = slots.map(slot =>
    sqsClient.send(new SendMessageCommand({
      QueueUrl: queueUrl,
      MessageBody: JSON.stringify(slot)
    })));
  
  await Promise.all(publishes);
};


