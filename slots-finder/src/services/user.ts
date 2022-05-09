import { UserDTO, UserSchema } from '../model/user';
import {
  DynamoDBClient,
  PutItemCommand,
  ScanCommand,
  UpdateItemCommand
} from '@aws-sdk/client-dynamodb';
import { ValidationError } from 'joi';
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb';

export enum UserDomainStatus {
  Available = 'Available', //User created
  Unavailable = 'Unavailable',
  PreparationFailed = 'PreparationFailed',
  AppointmentSet = 'AppointmentSet', //Appointment was created successfully
  DoubleBooking = 'DoubleBooking' //Could not create an appointment due to double booking,
}

export interface UserDomain {
  id: string;
  firstName: string;
  lastName: string;
  preferredCities: string[];
  cities: string[]; // For backward compatibility
  phone: string;
  userStatus: UserDomainStatus;
  handled: boolean;
  createdAt: number;
  updatedAt: number;
}

export const isUser = (user: any): user is UserDomain => user.firstName;

interface IUserService {
  createUser(userDTO: UserDTO): Promise<UserDomain | ValidationError>;
  getFirstUserByCity(city: string): Promise<UserDomain | null>;
  markUserUnavailable(id: string): Promise<UserDomain>;
  markUserAvailable(id:string): Promise<UserDomain>;
}

export class UserService implements IUserService {
  constructor(private readonly dbClient: DynamoDBClient, private readonly usersTableName: string = process.env.USERS_TABLE!) {
  }

  private sortByDate = (userA: UserDomain, userB: UserDomain) => userA.createdAt - userB.createdAt;

  async createUser(user: UserDTO): Promise<UserDomain | ValidationError> {
    const { value, error } = UserSchema.validate(user);
    if (value) {
      const userDomain: UserDomain = {
        ...value,
        handled: false,
        preferredCities: value.cities,
        userStatus: UserDomainStatus.Available,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      const response = await this.dbClient.send(new PutItemCommand({
        Item: marshall(userDomain),
        TableName: this.usersTableName,
        ReturnValues: 'ALL_NEW'
      }));

      return unmarshall(response.Attributes!) as Promise<UserDomain>;
    }
    return error!;
  }

  async getFirstUserByCity(city: string): Promise<UserDomain | null> {
    const command = new ScanCommand({
      TableName: process.env.USERS_TABLE,
      FilterExpression: 'contains(#DYNOBASE_cities, :cities) AND #DYNOBASE_handled = :handled',
      ExpressionAttributeNames: {
        '#DYNOBASE_cities': 'cities',
        '#DYNOBASE_handled': 'handled'
      },
      ExpressionAttributeValues: {
        ':cities': { S: city },
        ':handled': { BOOL: false }
      }
    });
    const { Items } = await this.dbClient.send(command);
    const response = (Items || []).map(item => unmarshall(item) as UserDomain).sort((a, b) => this.sortByDate(a, b));
    return response[0] ?? null;
  }

  async markUserUnavailable(id: string): Promise<UserDomain> {
    const command = new UpdateItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        id: { S: `${id}` }
      },
      UpdateExpression: 'set handled = :value, userStatus = :userStatus',
      ExpressionAttributeValues: {
        ':value': { BOOL: true },
        ':userStatus': { S: UserDomainStatus.Unavailable }
      },
      ReturnValues: 'ALL_NEW'
    });
    const response = await this.dbClient.send(command);
    return unmarshall(response.Attributes!) as UserDomain;
  }

  async setUserStatus(id: string, userStatus: UserDomainStatus): Promise<UserDomain> {
    const command = new UpdateItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        id: { S: `${id}` }
      },
      UpdateExpression: 'set userStatus = :userStatus',
      ExpressionAttributeValues: {
        ':userStatus': { S: userStatus }
      },
      ReturnValues: 'ALL_NEW'
    });
    const response = await this.dbClient.send(command);
    return unmarshall(response.Attributes!) as UserDomain;
  }

  async markUserAvailable(id: string): Promise<UserDomain> {
    const command = new UpdateItemCommand({
      TableName: process.env.USERS_TABLE,
      Key: {
        id: { S: `${id}` }
      },
      UpdateExpression: 'set handled = :value, userStatus = :userStatus',
      ExpressionAttributeValues: {
        ':value': { BOOL: false },
        ':userStatus': { S: UserDomainStatus.Available }
      },
      ReturnValues: 'ALL_NEW'
    });
    const response = await this.dbClient.send(command);
    return unmarshall(response.Attributes!) as UserDomain;
  }


}
