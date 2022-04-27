import { SlotsFinder } from './src/slots-finder';
import { HttpService, SessionCreator } from 'get-in-line-shared/dist';

const MAX_DAYS = 7;
export const run = async (_event: any, _context: any) => {
  const token = await SessionCreator.create()
  const httpService = new HttpService(token);
  const slotsFinder = new SlotsFinder(httpService);
  const slots = await slotsFinder.find(MAX_DAYS)
  console.log(slots)
};
