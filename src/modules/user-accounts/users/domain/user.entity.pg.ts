import { v4 as uuidv4 } from "uuid";
import { Injectable } from "@nestjs/common";

import { CreateUserDomainDto } from "./dto/create-user.domain.dto";

export const loginConstraints = {
  minLength: 3,
  maxLength: 10,
};

export const passwordConstraints = {
  minLength: 6,
  maxLength: 20,
};

@Injectable()
export class UserEntity {
  constructor() {}

  id: string;
  login: string;
  email: string;
  passwordHash: string;
  isEmailConfirmed: boolean;
  createdAt: string;
  deletedAt: string | null;

  createInstance(dto: CreateUserDomainDto): UserEntity {
    const user = new UserEntity();

    user.id = uuidv4();
    user.email = dto.email;
    user.passwordHash = dto.passwordHash;
    user.login = dto.login;
    user.isEmailConfirmed = false;
    user.createdAt = new Date(Date.now()).toISOString();

    return user;
  }
}
