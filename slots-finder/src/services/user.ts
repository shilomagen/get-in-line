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

export interface UserDomainV2 {
  id: string;
  email?: string;
  firstName: string;
  lastName: string;
  preferredCities: string[];
  phone: string;
  userStatus: UserDomainStatus;
  createdAt: number;
  updatedAt: number;
}

export const isUser = (user: any): user is UserDomainV2 => user.firstName;

interface IUserService {
  createUser(userDTO: UserDTO): Promise<UserDomainV2 | ValidationError>;
  getFirstUserByCity(city: string): Promise<UserDomainV2 | null>;
  setUserStatus(id: string, userStatus: UserDomainStatus): Promise<UserDomainV2>;
}

export class UserService implements IUserService {
  constructor(private readonly dbClient: DynamoDBClient, private readonly usersTableName: string = process.env.USERS_TABLE_V2!) {
  }

  private sortByDate = (userA: UserDomainV2, userB: UserDomainV2) => userA.createdAt - userB.createdAt;

  async createUser(user: UserDTO): Promise<UserDomainV2 | ValidationError> {
    const { value, error } = UserSchema.validate(user);
    if (value) {
      const userDomain: UserDomainV2 = {
        ...value,
        preferredCities: value.preferredCities,
        userStatus: UserDomainStatus.Available,
        createdAt: Date.now(),
        updatedAt: Date.now()
      };
      await this.dbClient.send(new PutItemCommand({
        Item: marshall(userDomain),
        TableName: this.usersTableName,
      }));

      return userDomain;
    }
    return error!;
  }

  async getFirstUserByCity(city: string): Promise<UserDomainV2 | null> {
    const command = new ScanCommand({
      TableName: this.usersTableName,
      FilterExpression: 'contains(#DYNOBASE_preferredCities, :preferredCities) AND #DYNOBASE_userStatus = :userStatus',
      ExpressionAttributeNames: {
        '#DYNOBASE_preferredCities': 'preferredCities',
        '#DYNOBASE_userStatus': 'userStatus'
      },
      ExpressionAttributeValues: {
        ':preferredCities': { S: city },
        ':userStatus': { S: UserDomainStatus.Available }
      }
    });
    const { Items } = await this.dbClient.send(command);
    const response = (Items || []).map(item => unmarshall(item) as UserDomainV2).sort((a, b) => this.sortByDate(a, b));
    return response[0] ?? null;
  }

  async setUserStatus(id: string, userStatus: UserDomainStatus): Promise<UserDomainV2> {
    const command = new UpdateItemCommand({
      TableName: this.usersTableName,
      Key: {
        id: { S: `${id}` }
      },
      UpdateExpression: 'set userStatus = :userStatus',
      ExpressionAttributeValues: {
        ':userStatus': { S: userStatus },
        ':updatedAt': { N: `${Date.now()}` }
      }
    });
    const response = await this.dbClient.send(command);
    return unmarshall(response.Attributes!) as UserDomainV2;
  }

}
