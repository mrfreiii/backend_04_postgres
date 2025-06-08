import { CommandHandler, ICommandHandler } from "@nestjs/cqrs";
import { UsersRepository } from "../../infrastructure/users.repository";

export class DeleteUserCommand {
  constructor(public id: string) {}
}

@CommandHandler(DeleteUserCommand)
export class DeleteUserCommandHandler
  implements ICommandHandler<DeleteUserCommand, void>
{
  constructor(private usersRepository: UsersRepository) {}

  async execute({ id }: DeleteUserCommand): Promise<void> {
    await this.usersRepository.findOrNotFoundFail_pg(id);

    const deletedAt = new Date(Date.now()).toISOString();
    await this.usersRepository.makeUserDeleted_pg({ id, deletedAt });
  }
}
