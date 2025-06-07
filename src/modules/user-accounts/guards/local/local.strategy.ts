import { Strategy } from "passport-local";
import { Injectable } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { validate } from "class-validator";
import { plainToInstance } from "class-transformer";
import { CommandBus } from "@nestjs/cqrs";

import { UserContextDto } from "../dto/user-context.dto";
import { throwFormattedErrors } from "../../../../setup/pipes.setup";
import { DomainException } from "../../../../core/exceptions/domain-exceptions";
import { LoginUserInputDto } from "../../auth/api/input-dto/login -user.input-dto";
import { DomainExceptionCode } from "../../../../core/exceptions/domain-exception-codes";
import { ValidateUserCommand } from "../../auth/application/usecases/validate-user.usecase";

@Injectable()
export class LocalStrategy extends PassportStrategy(Strategy) {
  constructor(private commandBus: CommandBus) {
    super({ usernameField: "loginOrEmail" });
  }

  //validate возвращает то, что впоследствии будет записано в req.user
  async validate(
    loginOrEmail: string,
    password: string,
  ): Promise<UserContextDto> {
    const instance = plainToInstance(LoginUserInputDto, {
      loginOrEmail,
      password,
    });

    const errors = await validate(instance);

    if (errors.length > 0) {
      throwFormattedErrors(errors);
    }
    // if (typeof loginOrEmail !== "string") {
    //   throw new DomainException({
    //     code: DomainExceptionCode.Unauthorized,
    //     message: "Value of loginOrEmail must be string",
    //   });
    // }
    //
    // if (typeof password !== "string") {
    //   throw new DomainException({
    //     code: DomainExceptionCode.Unauthorized,
    //     message: "Value of password must be string",
    //   });
    // }
    const user = await this.commandBus.execute(
      new ValidateUserCommand({
        loginOrEmail,
        password,
      }),
    );
    if (!user) {
      throw new DomainException({
        code: DomainExceptionCode.Unauthorized,
        message: "Invalid username or password",
        extensions: [
          {
            field: "",
            message: "Invalid username or password",
          },
        ],
      });
    }

    return user;
  }
}
