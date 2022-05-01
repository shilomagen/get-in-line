import { DynamoDBClient } from '@aws-sdk/client-dynamodb';

export const createDynamoDBClient = (): DynamoDBClient => {
  if (process.env.IS_OFFLINE) {
    return new DynamoDBClient({
      region: 'localhost',
      endpoint: 'http://localhost:5000',
    });
  }

  return new DynamoDBClient({ region: 'eu-central-1' });
};
