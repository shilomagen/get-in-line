import { createDynamoDBClient } from './src/model/db-client';
import { Appointment, EnrichedSlot, ResponseStatus } from './src/internal-types';
import { ErrorCode } from './src/consts';
import { getLogger, LoggerMessages, withRequest } from './src/services/logger';
import { UserDomain, UserDomainStatus, UserService } from './src/services/user';
import { BaseLogger } from 'pino';
import { Publisher } from './src/services/publisher';
import { AppointmentScheduler } from './src/services/appointment-scheduler';

export type UserAppointment =
  Appointment
  & Omit<UserDomain, 'cities' | 'handled' | 'preferredCities' | 'status'>;

interface ActionsToTake {
  shouldRetry: boolean;
  shouldPublish: boolean;
}

const ErrorHandlers: Record<ErrorCode, (userService: UserService, userId: string | undefined, logger: BaseLogger) => Promise<ActionsToTake>> = {
  [ErrorCode.General]: () => Promise.resolve({ shouldRetry: false, shouldPublish: false }),
  [ErrorCode.AlreadyHadAnAppointment]: async (userService: UserService, userId: string | undefined, logger: BaseLogger) => {
    logger.info({userId}, LoggerMessages.MarkUserDoubleBooking)
    await userService.setUserStatus(userId!, UserDomainStatus.DoubleBooking);
    return { shouldRetry: true, shouldPublish: true };
  },
  [ErrorCode.SetAppointmentGeneralError]: async (userService: UserService, userId: string | undefined, logger: BaseLogger) => {
    logger.info({userId}, LoggerMessages.MarkUserAvailable)
    await userService.markUserAvailable(userId!);
    return { shouldRetry: false, shouldPublish: false };
  },
  [ErrorCode.NoCityFoundForUser]: async () => Promise.resolve({ shouldRetry: false, shouldPublish: false }),
  [ErrorCode.IdNotValid]: async (userService: UserService, userId: string | undefined, logger: BaseLogger) => {
    logger.info({userId}, LoggerMessages.MarkUserPreparationFailed)
    await userService.setUserStatus(userId!, UserDomainStatus.PreparationFailed);
    return ({ shouldRetry: true, shouldPublish: true });
  },
  [ErrorCode.PhoneNumberNotValid]: async (userService: UserService, userId: string | undefined, logger: BaseLogger) => {
    logger.info({userId}, LoggerMessages.MarkUserPreparationFailed)
    await userService.setUserStatus(userId!, UserDomainStatus.PreparationFailed);
    return ({ shouldRetry: false, shouldPublish: true });
  },
};

export async function setAppointment(event: any, context: any) {
  withRequest(event, context);
  const logger = getLogger();
  const userService = new UserService(createDynamoDBClient());
  const slot = JSON.parse(event.Records[0].body) as EnrichedSlot;
  const publisher = new Publisher();
  logger.info({ slot }, LoggerMessages.SetAppointmentStart);
  const appointmentSetter = new AppointmentScheduler(userService, slot, logger);
  const appointmentResponse = await appointmentSetter.set();
  logger.info({ appointmentResponse }, LoggerMessages.AppointmentResponse);
  if (appointmentResponse.status === ResponseStatus.Failed) {
    const errorHandler = ErrorHandlers[appointmentResponse.data.errorCode];
    const {
      shouldPublish,
      shouldRetry
    } = await errorHandler(userService, appointmentResponse.user?.id, logger);
    if (shouldPublish) {
      await publisher.publishToNotifier(appointmentResponse);
    }
    if (shouldRetry) {
      throw new Error('Retry, please');
    }
  } else {
    await publisher.publishToNotifier(appointmentResponse);
  }
}


