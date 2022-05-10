import { Twilio } from 'twilio';
import { getLogger, LoggerMessages, withRequest } from './src/services/logger';
import { SmsNotifierService } from './src/services/sms-notifier';
import { AppointmentSetterResponse, ResponseStatus } from './src/internal-types';
import { Messages } from './src/messages';
import { ErrorCode } from './src/consts';
import { UserDomainV2 } from './src/services/user';
import { UserAppointment } from './appointment-setter';
import { BaseLogger } from 'pino';
import { HttpService } from './src/services';


const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

const noop = () => Promise.resolve();

const errors: Record<ErrorCode, (user: UserDomainV2 | null, logger: BaseLogger) => Promise<void>> = {
  [ErrorCode.NoCityFoundForUser]: noop,
  [ErrorCode.AlreadyHadAnAppointment]: async (user: UserDomainV2 | null, logger: BaseLogger) => {
    logger.info({}, LoggerMessages.NotifyDoubleBooking);
    await HttpService.notifyDoubleBookingEmail(user!.id);
  },
  [ErrorCode.General]: noop,
  [ErrorCode.IdNotValid]: noop,
  [ErrorCode.PhoneNumberNotValid]: noop,
  [ErrorCode.SetAppointmentGeneralError]: noop
};

export const notifySuccess = async (appointment: UserAppointment, user: UserDomainV2, logger: BaseLogger): Promise<void> => {
  const smsNotifierService = new SmsNotifierService(new Twilio(twilioAccountSid!, twilioAuthToken!));
  const phoneToSend = user.phone.replace('0', '+972');
  const notifyResponse = await smsNotifierService.send(phoneToSend, Messages.scheduleSuccess(appointment));
  logger.info({ notifyResponse }, LoggerMessages.SMSPublishResult);
};
export const notifyAppointmentSet = async (event: any, context: any) => {
  withRequest(event, context);
  const logger = getLogger();

  const message = JSON.parse(event.Records[0].body) as AppointmentSetterResponse;
  logger.info({ message }, LoggerMessages.ReceivedNotifyMessage);
  if (message.status === ResponseStatus.Success) {
    await notifySuccess(message.data, message.user!, logger);
  } else {
    await errors[message.data.errorCode](message.user, logger);
  }
};

