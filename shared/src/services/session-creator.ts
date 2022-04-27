import axios from 'axios';
import { CreateSessionResponse } from '../api/create-session';
import { Urls } from './http';

export class SessionCreator {
  static async create(): Promise<string> {
    const maybeToken = await axios.get<CreateSessionResponse>(Urls.createAnonymousSession).then(res => res.data.Results?.token);
    if (maybeToken) {
      return maybeToken;
    }
    throw new Error('Could not create session');
  }
}
