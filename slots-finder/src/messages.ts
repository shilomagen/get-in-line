import { UserAppointment } from '../appointment-setter';
import { UserDomainV2 } from './services/user';

export const Messages = {
  scheduleSuccess: (userAppointment: UserAppointment) => `היי ${userAppointment.firstName}, קבענו לך תור לעיר ${userAppointment.city} בסניף ${userAppointment.branchName} בכתובת ${userAppointment.address} בתאריך ${userAppointment.date} בשעה ${userAppointment.hour}\n
  עזרו לנו להמשיך לפתח ולתחזק את גםכןבוט ופרגנו לנו בקפה 🤙\n
  https://bit.ly/3KHsUiB 
  `,
  invalidPhone: (_user: UserDomainV2) => 'Data is wrong',
  invalidId: (_user: UserDomainV2) => 'Data is wrong',
  doubleBooking: (_user: UserDomainV2) => 'Double Booking',
}
