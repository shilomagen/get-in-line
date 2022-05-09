import { Twilio } from 'twilio';
import { getLogger, LoggerMessages, withRequest } from './src/services/logger';
import { SmsNotifierService } from './src/services/sms-notifier';
import { AppointmentSetterResponse, ResponseStatus } from './src/internal-types';
import { Messages } from './src/messages';

const twilioAccountSid = process.env.TWILIO_ACCOUNT_SID;
const twilioAuthToken = process.env.TWILIO_AUTH_TOKEN;

// const errors: Record<ErrorCode, (user: UserDomain) => string | null> = {
//   [ErrorCode.NoCityFoundForUser]: () => null,
//   [ErrorCode.AlreadyHadAnAppointment]: Messages.doubleBooking,
//   [ErrorCode.General]: () => null,
//   [ErrorCode.IdNotValid]: Messages.invalidId,
//   [ErrorCode.PhoneNumberNotValid]: Messages.invalidPhone,
//   [ErrorCode.SetAppointmentGeneralError]: () => null
// };

export const notifyAppointmentSet = async (event: any, context: any) => {
  const smsNotifierService = new SmsNotifierService(new Twilio(twilioAccountSid!, twilioAuthToken!));

  withRequest(event, context);
  const logger = getLogger();

  const message = JSON.parse(event.Records[0].body) as AppointmentSetterResponse;
  logger.info({ ...message }, LoggerMessages.NotifyToRecipientAboutAppointment);
  const content = message.status === ResponseStatus.Success ? Messages.scheduleSuccess(message.data) : null
  if (content) {
    const phoneToSend = message.user!.phone.replace('0', '+972');
    const notifyResponse = await smsNotifierService.send(phoneToSend, content);
    logger.info({ notifyResponse }, LoggerMessages.SMSPublishResult);
  }
};

