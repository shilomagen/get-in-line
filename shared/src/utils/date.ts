import format from 'date-fns/format';
import differenceInDays from 'date-fns/differenceInDays';

const ApiDateFormat = 'yyyy-MM-dd';
const IsraelDateFormat = 'dd-MM-yyyy';

export const DateUtils = {
  isDateInDaysRange: (date: string, maxDaysDifference: number) => differenceInDays(new Date(date), new Date()) < maxDaysDifference,
  timeSinceMidnightToHour: (timeSinceMidnight: number): string => `${Math.floor(timeSinceMidnight / 60)}:${timeSinceMidnight % 60}`,
  toApiFormattedDate: (date: string | number) => format(new Date(date), ApiDateFormat),
  toIsraelFormattedDate: (date: string | number) => format(new Date(date), IsraelDateFormat)
};
