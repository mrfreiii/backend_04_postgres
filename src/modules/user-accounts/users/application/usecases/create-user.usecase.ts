import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";

import { CryptoService } from "../crypto.service";
import { UserEntity } from "../../domain/user.entity.pg";
import { CreateUserDto } from "../../dto/create-user.dto";
import { UsersRepository } from "../../infrastructure/users.repository";
import { DomainException } from "../../../../../core/exceptions/domain-exceptions";
import { DomainExceptionCode } from "../../../../../core/exceptions/domain-exception-codes";

export class CreateUserCommand {
  constructor(public dto: CreateUserDto) {}
}

@CommandHandler(CreateUserCommand)
export class CreateUserCommandHandler
  implements ICommandHandler<CreateUserCommand, string>
{
  constructor(
    // @InjectModel(User.name) private UserModel: UserModelType,
    private usersRepository: UsersRepository,
    private cryptoService: CryptoService,
    private userEntity: UserEntity,
  ) {}

  async execute({ dto }: CreateUserCommand): Promise<string> {
    const userWithTheSameLogin = await this.usersRepository.findByLogin_pg(
      dto.login,
    );
    if (userWithTheSameLogin) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "User with the same login already exists",
        extensions: [
          {
            field: "login",
            message: "User with the same login already exists",
          },
        ],
      });
    }

    const userWithTheSameEmail = await this.usersRepository.findByEmail_pg(
      dto.email,
    );
    if (userWithTheSameEmail) {
      throw new DomainException({
        code: DomainExceptionCode.BadRequest,
        message: "User with the same email already exists",
        extensions: [
          {
            field: "email",
            message: "User with the same email already exists",
          },
        ],
      });
    }

    const passwordHash = await this.cryptoService.createPasswordHash(
      dto.password,
    );

    const user = this.userEntity.createInstance({
      email: dto.email,
      login: dto.login,
      passwordHash,
    });

    return this.usersRepository.createUser_pg(user);
  }
}
