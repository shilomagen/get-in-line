import { Twilio } from 'twilio';


interface ISmsNotifier {
  send(to: string, body: string): Promise<{ success: boolean }>;
}

export class SmsNotifierService implements ISmsNotifier {
  constructor(private readonly smsProvider: Twilio) {
  }

  send(to: string, body: string) {
    return this.smsProvider.messages.create({
      body,
      to,
      from: process.env.TWILIO_MESSAGING_SERVICE_SID,
    }).then(res => ({ success: !res.errorCode }));
  }

}
