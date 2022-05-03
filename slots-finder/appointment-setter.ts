import { createDynamoDBClient } from './src/model/db-client';
import { DynamoDBClient, ScanCommand, UpdateItemCommand } from '@aws-sdk/client-dynamodb';
import { unmarshall } from '@aws-sdk/util-dynamodb';
import { UserDomain } from './user-creator';
import { SendMessageCommand, SQSClient } from '@aws-sdk/client-sqs';
import { Appointment, EnrichedSlot, InternalSetAppointmentResponse } from './src/internal-types';
import { AppointmentHandler, HttpService, SessionCreator, VisitPreparer } from './src/services';
import { toAppointment } from './src/mappers';
import { ErrorCode } from './src/consts';
import { getLogger, LoggerMessages, withRequest } from './src/services/logger';

const logger = getLogger();

export type UserAppointment = Appointment & Omit<UserDomain, 'cities' | 'handled'>;

const byDate = (a: UserDomain, b: UserDomain) => a.createdAt - b.createdAt;

async function getFirstUserByUser(city: string, dbClient: DynamoDBClient): Promise<UserDomain | null> {

  logger.info({ city }, LoggerMessages.CityLookup);
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
  return response[0] ?? null;
}


async function scheduleAppointment(user: UserDomain, slot: EnrichedSlot, dbClient: DynamoDBClient): Promise<InternalSetAppointmentResponse> {
  const { id, firstName, lastName, phone } = user;
  const token = await SessionCreator.create();
  const httpClient = new HttpService(token);
  const visitPreparer = new VisitPreparer(httpClient);
  const appointmentHandler = new AppointmentHandler(httpClient);
  logger.info({}, LoggerMessages.StartVisitPrepare);
  const userVisit = await visitPreparer.prepare({ id, firstName, lastName, phone }, slot.serviceId);
  if (userVisit.status === 'SUCCESS') {
    logger.info({}, LoggerMessages.SetAppointmentStart);
    const response = await appointmentHandler.setAppointment(userVisit.data, slot);
    if (response.status === 'SUCCESS') {
      return {
        status: 'SUCCESS',
        data: response.data
      };
    } else {
      if (response.data.errorCode === ErrorCode.SetAppointmentGeneralError) {
        logger.info({ userId: user.id }, LoggerMessages.MarkUserNotHandled);
        await markHandled(user.id, dbClient, false);
      }
      return {
        status: 'FAILED',
        data: {
          errorCode: response.data.errorCode
        }
      };
    }

  }
  return {
    status: 'FAILED',
    data: {
      errorCode: userVisit.data.errorCode
    }
  };


}

async function markHandled(userId: string, dbClient: DynamoDBClient, handled: boolean) {
  const command = new UpdateItemCommand({
    TableName: process.env.USERS_TABLE,
    Key: {
      id: { S: `${userId}` }
    },
    UpdateExpression: 'set handled = :value',
    ExpressionAttributeValues: {
      ':value': { BOOL: handled }
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

export async function setAppointment(event: any, context: any) {
  withRequest(event, context);

  const dbClient = createDynamoDBClient();
  const slot = JSON.parse(event.Records[0].body) as EnrichedSlot;
  const { mappedCity } = slot;
  if (mappedCity) {
    const user = await getFirstUserByUser(mappedCity, dbClient);
    if (user) {
      logger.info({ user }, LoggerMessages.MarkUserHandled);
      await markHandled(user.id, dbClient, true);
      logger.info({ userId: user.id }, LoggerMessages.ScheduleAppointmentStart);
      const appointmentResponse = await scheduleAppointment(user, slot, dbClient);
      if (appointmentResponse.status === 'SUCCESS') {
        const userAppointment: UserAppointment = { ...toAppointment(slot), ...user };
        logger.info({ userAppointment }, LoggerMessages.UserAppointmentSuccessPublishToNotifier);
        await publishAppointmentWasSet(userAppointment);
      } else {
        logger.error({ error: appointmentResponse.data }, LoggerMessages.UserAppointmentError);
      }
    } else {
      logger.info({ city: mappedCity }, LoggerMessages.UserNotFoundForCity);
    }
  }
}


