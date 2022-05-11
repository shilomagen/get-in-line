import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { AppointmentSetterResponse, EnrichedSlot } from '../internal-types';

interface IPublisher {
  publishToNotifier(message: AppointmentSetterResponse): Promise<void>;
  publishToAppointmentSetter(slot: EnrichedSlot): Promise<void>;
}

const QueueUrls = {
  Notifier: process.env.NOTIFIER_QUEUE_URL!,
  AppointmentSetter: process.env.SLOTS_QUEUE_URL!
}
export class Publisher implements IPublisher {

  constructor(private readonly sqsClient = new SQSClient({ region: 'eu-central-1' })) {}

  async publishToNotifier(message: AppointmentSetterResponse): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: QueueUrls.Notifier,
      MessageBody: JSON.stringify(message)
    });
    await this.sqsClient.send(command)
  }

  async publishToAppointmentSetter(slot: EnrichedSlot): Promise<void> {
    const command = new SendMessageCommand({
      QueueUrl: QueueUrls.AppointmentSetter,
      MessageBody: JSON.stringify(slot)
    });
    await this.sqsClient.send(command)
  }
}
