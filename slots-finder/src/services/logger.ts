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
  ScheduleAppointmentStart = 'ScheduleAppointmentStart',
  UserAppointmentSuccessPublishToNotifier = 'UserAppointmentSuccessPublishToNotifier',
  UserAppointmentError = 'UserAppointmentError',
  VisitPrepareError = 'VisitPrepareError',
  VisitPrepareNextMessage = 'VisitPrepareNextMessage',
  VisitPrepareInitialQuestion = 'VisitPrepareInitialQuestion',
  VisitPrepareDoneQuestions = 'VisitPrepareDoneQuestions',
}

const destination = pinoLambdaDestination();
const logger = pino({
  // typical pino options
}, destination);
export const withRequest = lambdaRequestTracker();

export const getLogger = () => logger;
