import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

export enum LoggerMessages {
  CityLookup = 'CityLookup',
  UserNotFoundForCity = 'UserNotFoundForCity',
  StartVisitPrepare = 'StartVisitPrepare',
  ErrorSetAppointment = 'ErrorSetAppointment',
  Request = 'Request',
  Response = 'Response',
  SetAppointmentStart = 'SetAppointmentStart',
  SlotsFound = 'SlotsFound',
  MarkUserHandled = 'MarkUserHandled',
  MarkUserNotHandled = 'MarkUserNotHandled',
  ScheduleAppointmentStart = 'ScheduleAppointmentStart',
  UserAppointmentSuccessPublishToNotifier = 'UserAppointmentSuccessPublishToNotifier',
  UserAppointmentError = 'UserAppointmentError',
  VisitPrepareError = 'VisitPrepareError',
  VisitPrepareNextMessage = 'VisitPrepareNextMessage',
  VisitPrepareInitialQuestion = 'VisitPrepareInitialQuestion',
  VisitPrepareDoneQuestions = 'VisitPrepareDoneQuestions',
  NotifyToRecipientAboutAppointment = 'NotifyToRecipient',
  SMSPublishResult = 'SMSPublishResult',
}

const destination = pinoLambdaDestination();
const logger = pino({
  // typical pino options
}, destination);
export const withRequest = lambdaRequestTracker();

export const getLogger = () => logger;
