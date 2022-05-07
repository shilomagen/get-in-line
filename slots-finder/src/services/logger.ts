import pino from 'pino';
import { lambdaRequestTracker, pinoLambdaDestination } from 'pino-lambda';

export enum LoggerMessages {
  CityLookup = 'CityLookup',
  UserNotFoundForCity = 'UserNotFoundForCity',
  StartVisitPrepare = 'StartVisitPrepare',
  SetAppointmentError = 'SetAppointmentError',
  SetAppointmentSuccess = 'SetAppointmentSuccess',
  AppointmentResponse = 'AppointmentResponse',
  Request = 'Request',
  Response = 'Response',
  LookingForUserInCity =  'LookingForUserInCity',
  SetAppointmentStart = 'SetAppointmentStart',
  UserCreateRequest = 'UserCreateRequest',
  UserCreateSuccess = 'UserCreateSuccess',
  UserCreateError = 'UserCreateError',
  ScheduleAppointmentStart = 'ScheduleAppointmentStart',
  SlotsFound = 'SlotsFound',
  MarkUserUnavailable = 'MarkUserUnavailable',
  MarkUserPreparationFailed = 'MarkUserPreparationFailed',
  MarkUserDoubleBooking = 'MarkUserDoubleBooking',
  MarkUserAvailable = 'MarkUserAvailable',
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
