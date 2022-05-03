import { PublishCommand, SetSMSAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { UserAppointment } from './appointment-setter';

const SHILOS_PHONE = process.env.SHILOS_PHONE;
export const notifyAppointmentSet = async (event: any, _context: any) => {
  const userAppointment = JSON.parse(event.Records[0].body) as UserAppointment;
  const phoneToSend = userAppointment.phone.replace('0', '+972');
  const phonesToNotify = [SHILOS_PHONE, phoneToSend];

  const content = `היי ${userAppointment.firstName}, קבענו לך תור לעיר ${userAppointment.city} בסניף ${userAppointment.branchName} בכתובת ${userAppointment.address} בתאריך ${userAppointment.date} בשעה ${userAppointment.hour}\n
  עזרו לנו להמשיך לפתח ולתחזק את גםכןבוט ופרגנו לנו בקפה 🤙 \n
  https://bit.ly/3KHsUiB 
  `;
  const client = new SNSClient({ region: 'eu-central-1' });
  const setSmsAttributesCmd = new SetSMSAttributesCommand({
    attributes: {
      DefaultSMSType: 'Promotional'
    }
  });
  const publishPromises = phonesToNotify.map(phone => {
    client.send(new PublishCommand({
      Message: content,
      Subject: 'תור נקבע',
      PhoneNumber: phone,
    }));
  });

  await client.send(setSmsAttributesCmd);
  await Promise.all(publishPromises);
};

