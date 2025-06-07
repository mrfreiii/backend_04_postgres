import {
  Body,
  Controller,
  Delete,
  Get,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  UseGuards,
} from "@nestjs/common";
import { CommandBus } from "@nestjs/cqrs";
import { ApiBasicAuth, ApiParam } from "@nestjs/swagger";

import { SETTINGS } from "../../../../settings";
import { UserViewDto } from "./view-dto/users.view-dto";
import { CreateUserInputDto } from "./input-dto/users.input-dto";
import { PaginatedViewDto } from "../../../../core/dto/base.paginated.view-dto";
import { GetUsersQueryParams } from "./input-dto/get-users-query-params.input-dto";
import { UsersQueryRepository } from "../infrastructure/query/users.query-repository";
import { BasicAuthGuard } from "../../guards/basic/basic-auth.guard";
import { CreateUserCommand } from "../application/usecases/create-user.usecase";
import { DeleteUserCommand } from "../application/usecases/delete-user.usecase";

@Controller(SETTINGS.PATH.USERS)
@UseGuards(BasicAuthGuard)
@ApiBasicAuth("basicAuth")
export class UsersController {
  constructor(
    private usersQueryRepository: UsersQueryRepository,
    private commandBus: CommandBus,
  ) {}

  @Get()
  async getAll(
    @Query() query: GetUsersQueryParams,
  ): Promise<PaginatedViewDto<UserViewDto[]>> {
    return this.usersQueryRepository.getAll(query);
  }

  @Post()
  async createUser(@Body() body: CreateUserInputDto): Promise<UserViewDto> {
    const userId = await this.commandBus.execute(new CreateUserCommand(body));

    return this.usersQueryRepository.getByIdOrNotFoundFail(userId);
  }

  @ApiParam({ name: "id" })
  @Delete(":id")
  @HttpCode(HttpStatus.NO_CONTENT)
  async deleteUser(@Param("id") id: string): Promise<void> {
    return this.commandBus.execute(new DeleteUserCommand(id));
  }
}
