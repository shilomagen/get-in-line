import { CommonResultsResponse } from './common';

export interface CreateSessionRequest {
  isPersistent: boolean;
  useCookie: boolean;
}

interface CreateSessionResult {
  token: string;
  username: string;
}

export type CreateSessionResponse = CommonResultsResponse<CreateSessionResult>


