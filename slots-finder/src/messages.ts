import { UserAppointment } from '../appointment-setter';
import { UserDomain } from './services/user';

export const Messages = {
  scheduleSuccess: (userAppointment: UserAppointment) => `היי ${userAppointment.firstName}, קבענו לך תור לעיר ${userAppointment.city} בסניף ${userAppointment.branchName} בכתובת ${userAppointment.address} בתאריך ${userAppointment.date} בשעה ${userAppointment.hour}\n
  עזרו לנו להמשיך לפתח ולתחזק את גםכןבוט ופרגנו לנו בקפה 🤙\n
  https://bit.ly/3KHsUiB 
  `,
  invalidPhone: (_user: UserDomain) => 'Data is wrong',
  invalidId: (_user: UserDomain) => 'Data is wrong',
  doubleBooking: (_user: UserDomain) => 'Double Booking',
}
