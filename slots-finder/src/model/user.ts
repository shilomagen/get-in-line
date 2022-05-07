import Joi from 'joi';

export interface UserDTO {
  id: string;
  firstName: string;
  lastName: string;
  phone: string;
  cities: string[];
}

export const UserSchema = Joi.object<UserDTO>({
  id: Joi.string().pattern(/^\d+$/).min(7).max(9).required(),
  firstName: Joi.string().required(),
  lastName: Joi.string().required(),
  phone: Joi.string().pattern(/[0]\d+$/).length(10).length(10).required(),
  cities: Joi.array().sparse().items(Joi.string().required()).min(1)
})
