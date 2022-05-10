import { createDynamoDBClient } from './src/model/db-client';
import { UserDTO } from './src/model/user';
import { isUser, UserService } from './src/services/user';
import { getLogger, LoggerMessages, withRequest } from './src/services/logger';

export const create = async (event: any, context: any) => {
  withRequest(event, context);
  const logger = getLogger();
  logger.info({}, LoggerMessages.UserCreateRequest);
  const userService = new UserService(createDynamoDBClient());
  const userOrError = await userService.createUser(JSON.parse(event.body) as UserDTO);
  if (isUser(userOrError)) {
    logger.info({
      firstName: userOrError.firstName,
      lastName: userOrError.lastName
    }, LoggerMessages.UserCreateSuccess);
    return {
      statusCode: 200,
      body: JSON.stringify({ user: userOrError })
    };
  }
  logger.info({ userOrError }, LoggerMessages.UserCreateError);
  return {
    status: 400,
    body: JSON.stringify({ error: userOrError })
  };
};
