import { DataSource } from "typeorm";
import { Injectable } from "@nestjs/common";
import { validate as isValidUUID } from "uuid";
import { InjectDataSource } from "@nestjs/typeorm";

import { SETTINGS } from "../../../../settings";
import { UserEntity } from "../domain/user.entity.pg";
import { RegistrationEntity } from "../domain/registration.entity.pg";
import { PasswordRecoveryEntity } from "../domain/passwordRecovery.entity.pg";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";

@Injectable()
export class UsersRepository {
  constructor(@InjectDataSource() private dataSource: DataSource) {}

  async createUser_pg(user: any) {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.USERS}
            ("id","email","login","passwordHash","isEmailConfirmed","createdAt")
            VALUES
            ($1, $2, $3, $4, $5, $6)
    `;

    try {
      await this.dataSource.query(query, [
        user.id,
        user.email,
        user.login,
        user.passwordHash,
        user.isEmailConfirmed,
        user.createdAt,
      ]);

      return user.id;
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to create user in db",
        extensions: [
          {
            field: "",
            message: "Failed to create user in db",
          },
        ],
      });
    }
  }

  async findByLogin_pg(login: string): Promise<boolean> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "login" = $1
    `;

    try {
      const result = await this.dataSource.query(query, [login]);
      return result?.[0];
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user from db",
          },
        ],
      });
    }
  }

  async findByEmail_pg(email: string): Promise<UserEntity> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "email" = $1
    `;

    try {
      const result = await this.dataSource.query(query, [email]);
      return result?.[0];
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user from db",
          },
        ],
      });
    }
  }

  async findOrNotFoundFail_pg(id: string): Promise<UserEntity> {
    if (!isValidUUID(id)) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "User not found",
        extensions: [
          {
            field: "",
            message: "User not found",
          },
        ],
      });
    }

    let user: UserEntity;

    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS} WHERE "id" = $1
    `;

    try {
      const result = await this.dataSource.query(query, [id]);
      user = result?.[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user from db",
          },
        ],
      });
    }

    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.NotFound,
        message: "User not found",
        extensions: [
          {
            field: "",
            message: "User not found",
          },
        ],
      });
    }
    return user;
  }

  async makeUserDeleted_pg(dto: {
    id: string;
    deletedAt: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.USERS}
        SET "deletedAt" = '${dto.deletedAt}'
        WHERE "id" = $1
    `;

    try {
      await this.dataSource.query(query, [dto.id]);
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to delete user from db",
        extensions: [
          {
            field: "",
            message: "Failed to delete user from db",
          },
        ],
      });
    }
  }

  async setRegistrationConfirmationCode_pg(dto: {
    userId: string;
    confirmationCode: string;
    codeExpirationDate: number;
  }): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.USERS_REGISTRATION_INFO}
            ("confirmationCode","codeExpirationDate","userId")
            VALUES
            ($1, $2, $3)
    `;

    try {
      await this.dataSource.query(query, [
        dto.confirmationCode,
        dto.codeExpirationDate,
        dto.userId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to add registration confirmation code",
        extensions: [
          {
            field: "",
            message: "Failed to add registration confirmation code",
          },
        ],
      });
    }
  }

  async updateRegistrationConfirmationCode_pg(dto: {
    userId: string;
    confirmationCode: string;
    codeExpirationDate: number;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.USERS_REGISTRATION_INFO} 
       SET "confirmationCode" = $1,
           "codeExpirationDate" = $2
       WHERE "userId" = $3
    `;

    try {
      await this.dataSource.query(query, [
        dto.confirmationCode,
        dto.codeExpirationDate,
        dto.userId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update registration confirmation code",
        extensions: [
          {
            field: "",
            message: "Failed to update registration confirmation code",
          },
        ],
      });
    }
  }

  async findRegistrationInfoByConfirmationCode_pg(
    confirmationCode: string,
  ): Promise<RegistrationEntity | null> {
    if (!isValidUUID(confirmationCode)) {
      return null;
    }

    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS_REGISTRATION_INFO} WHERE "confirmationCode" = $1
    `;

    try {
      const response = await this.dataSource.query(query, [confirmationCode]);
      return response[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get row with registration confirmation code",
        extensions: [
          {
            field: "",
            message: "Failed to get row with registration confirmation code",
          },
        ],
      });
    }
  }

  async confirmUserRegistration_pg(userId: string): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.USERS} SET "isEmailConfirmed" = true WHERE "id" = $1
    `;

    try {
      await this.dataSource.query(query, [userId]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to confirm user registration",
        extensions: [
          {
            field: "",
            message: "Failed to confirm user registration",
          },
        ],
      });
    }
  }

  async setPasswordRecoveryCode_pg(dto: PasswordRecoveryEntity): Promise<void> {
    const query = `
        INSERT INTO ${SETTINGS.TABLES.USERS_PASSWORD_RECOVERY_INFO}
            ("recoveryCode","codeExpirationDate","userId")
            VALUES
            ($1, $2, $3)
    `;

    try {
      await this.dataSource.query(query, [
        dto.recoveryCode,
        dto.codeExpirationDate,
        dto.userId,
      ]);
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to add password recovery code",
        extensions: [
          {
            field: "",
            message: "Failed to add password recovery code",
          },
        ],
      });
    }
  }

  async findPasswordRecoveryInfoByRecoveryCode_pg(
    recoveryCode: string,
  ): Promise<PasswordRecoveryEntity | null> {
    if (!isValidUUID(recoveryCode)) {
      return null;
    }

    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS_PASSWORD_RECOVERY_INFO} WHERE "recoveryCode" = $1
    `;

    try {
      const response = await this.dataSource.query(query, [recoveryCode]);
      return response[0];
    } catch (e) {
      console.log(e);
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get row with password recovery code",
        extensions: [
          {
            field: "",
            message: "Failed to get row with password recovery code",
          },
        ],
      });
    }
  }

  async updateUserPassword_pg(dto: {
    userId: string;
    newPassword: string;
  }): Promise<void> {
    const query = `
       UPDATE ${SETTINGS.TABLES.USERS}
        SET "passwordHash" = '${dto.newPassword}'
        WHERE "id" = $1
    `;

    try {
      await this.dataSource.query(query, [dto.userId]);
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to update user password",
        extensions: [
          {
            field: "",
            message: "Failed to update user password",
          },
        ],
      });
    }
  }

  async findByLoginOrEmail_pg(dto: {
    login: string;
    email: string;
  }): Promise<UserEntity> {
    const query = `
       SELECT * FROM ${SETTINGS.TABLES.USERS}
        WHERE "login" = $1 OR "email" = $2
    `;

    try {
      const result = await this.dataSource.query(query, [dto.login, dto.email]);
      return result?.[0];
    } catch {
      throw new DomainException({
        code: DomainExceptionCode.InternalServerError,
        message: "Failed to get user from db",
        extensions: [
          {
            field: "",
            message: "Failed to get user from db",
          },
        ],
      });
    }
  }
}
