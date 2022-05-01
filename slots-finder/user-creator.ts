import { createDynamoDBClient } from './src/model/db-client';
import { PutItemCommand } from '@aws-sdk/client-dynamodb';
import { marshall } from '@aws-sdk/util-dynamodb';
import { UserDTO } from './src/model/user';

export interface UserDomain extends UserDTO {
  handled: boolean;
  createdAt: number;
}
export const create = async (event: any, _context: any) => {
  const dbClient = createDynamoDBClient();
  const userDomain = { ...JSON.parse(event.body), handled: false, createdAt: Date.now() };

  await dbClient.send(new PutItemCommand({
    Item: marshall(userDomain),
    TableName: process.env.USERS_TABLE
  }));
  return {
    statusCode: 200
  };
};
