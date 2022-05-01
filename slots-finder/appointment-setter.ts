import { createDynamoDBClient } from './src/model/db-client';
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { UserDomain } from './user-creator';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Appointment, EnrichedSlot } from './src/internal-types';
import { AppointmentSetResult } from './src/api';
import { AppointmentHandler, HttpService, SessionCreator, VisitPreparer } from './src/services';
import { toAppointment } from './src/mappers';

export type UserAppointment = Appointment & Omit<UserDomain, 'cities' | 'handled'>;

const byDate = (a: UserDomain, b: UserDomain) => a.createdAt - b.createdAt;

async function getFirstUserByUser(city: string, dbClient: DynamoDBClient): Promise<UserDomain | null> {
  console.log(`Looking for users with city ${city}`);
  const command = new ScanCommand({
    TableName: process.env.USERS_TABLE,
    FilterExpression: 'contains(#DYNOBASE_cities, :cities) AND #DYNOBASE_handled = :handled',
    ExpressionAttributeNames: {
      '#DYNOBASE_cities': 'cities',
      '#DYNOBASE_handled': 'handled'
    },
    ExpressionAttributeValues: {
      ':cities': { S: city },
      ':handled': { BOOL: false }
    }
  });
  const { Items } = await dbClient.send(command);
  const response = (Items || []).map(item => unmarshall(item) as UserDomain).sort(byDate);
  console.log(response);
  return response[0] ?? null;
}


async function scheduleAppointment(user: UserDomain, slot: EnrichedSlot): Promise<AppointmentSetResult | null> {
  const { id, firstName, lastName, phone } = user;
  const token = await SessionCreator.create();
  const httpClient = new HttpService(token);
  const visitPreparer = new VisitPreparer(httpClient);
  const appointmentHandler = new AppointmentHandler(httpClient);
  console.log('Preparing the visit');
  const userVisit = await visitPreparer.prepare({ id, firstName, lastName, phone }, slot.serviceId);
  console.log(userVisit);
  console.log('Setting up the appointment');
  const appointment = await appointmentHandler.setAppointment(userVisit, slot);
  console.log(appointment);
  return appointment;
}

async function markUserAsHandled(userId: string, dbClient: DynamoDBClient) {
  const command = new UpdateItemCommand({
    TableName: process.env.USERS_TABLE,
    Key: {
      id: { S: `${userId}` }
    },
    UpdateExpression: 'set handled = :value',
    ExpressionAttributeValues: {
      ':value': { BOOL: true }
    }
  });
  return dbClient.send(command);
}


function publishAppointmentWasSet(userAppointment: UserAppointment) {
  const sqsClient = new SQSClient({ region: 'eu-central-1' });
  const command = new SendMessageCommand({
    QueueUrl: process.env.NOTIFIER_QUEUE_URL,
    MessageBody: JSON.stringify(userAppointment)
  });
  return sqsClient.send(command);
}

export async function setAppointment(event: any, _context: any) {
  const dbClient = createDynamoDBClient();
  const slot = JSON.parse(event.Records[0].body) as EnrichedSlot;
  const { mappedCity } = slot;
  if (mappedCity) {
    const user = await getFirstUserByUser(mappedCity, dbClient);
    if (user) {
      console.log(`Scheduling appointment to user ${user.id}`);
      const appointment = await scheduleAppointment(user, slot);
      if (appointment) {
        console.log(`Marking user as handled ${user.id}`);
        await markUserAsHandled(user.id, dbClient);
        const userAppointment: UserAppointment = { ...toAppointment(slot), ...user };
        console.log(`Publishing to notifier ${user.id}`);
        await publishAppointmentWasSet(userAppointment);
      }


    } else {
      console.log(`No user was found for city ${mappedCity}`);
    }
  }
}


