import { PublishCommand, SetSMSAttributesCommand, SNSClient } from '@aws-sdk/client-sns';
import { UserAppointment } from './appointment-setter';

const SHILOS_PHONE = '+972544412112';
export const notifyAppointmentSet = async (event: any, _context: any) => {
  const userAppointment = JSON.parse(event.Records[0].body) as UserAppointment;
  const phoneToSend = userAppointment.phone.replace('0', '+972');
  const phonesToNotify = [SHILOS_PHONE, phoneToSend];

  const content = `היי ${userAppointment.firstName}, קבענו לכם תור לעיר ${userAppointment.city} בסניף ${userAppointment.branchName} בכתובת ${userAppointment.address} בתאריך ${userAppointment.date} בשעה ${userAppointment.hour}\n
  אם עזרנו לכם, נשמח לטיפ בלינק הבא :)\n 
  https://bit.ly/3OJ9bTf \n 
  תודה רבה!`;
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
