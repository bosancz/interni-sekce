import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Query, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { InjectRepository } from "@nestjs/typeorm";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { User } from "src/models/users/entities/user.entity";
import { UsersService } from "src/models/users/services/users.service";
import { Repository } from "typeorm";
import {
  UserCreateRoute,
  UserDeleteRoute,
  UserEditRoute,
  UserImpersonateRoute,
  UserReadRoute,
  UserSetPassword,
  UsersListRoute,
} from "../acl/user.acl";
import { UserCreateBody } from "../dto/user-create-body";
import { UserSetPasswordBody } from "../dto/user-set-password-body";
import { UserUpdateBody } from "../dto/user-update-body";
import { UserResponse } from "../dto/user.dto";
import { ListUsersQuery } from "../dto/users.dto";

@Controller("users")
@AcController()
@ApiTags("Users")
export class UsersController {
  constructor(
    private userService: UsersService,
    @InjectRepository(User) private userRepository: Repository<User>,
  ) {}

  @Get()
  @AcLinks(UsersListRoute)
  @ApiResponse({ type: WithLinks(UserResponse), isArray: true })
  async listUsers(@Req() req: Request, @Query() query: ListUsersQuery): Promise<Omit<UserResponse, "_links">[]> {
    const q = this.userRepository
      .createQueryBuilder("user")
      .select([
        "user.id",
        "user.login",
        "user.memberId",
        "user.roles",
        "user.email",
        "member.nickname",
        "member.firstName",
        "member.lastName",
      ])
      .leftJoin("user.member", "member")
      .where(UsersListRoute.canWhere(req))
      .orderBy("user.login", "ASC")
      .take(query.limit || 25)
      .skip(query.offset || 0);


    if (query.search)
      q.andWhere("user.login ILIKE :search OR member.nickname ILIKE :search", { search: `%${query.search}%` });

    if (query.roles) q.andWhere("user.roles && array[:...roles]::users_roles_enum[]", { roles: query.roles });

    return q.getMany();
  }

  @Post()
  @AcLinks(UserCreateRoute)
  @ApiResponse({ type: WithLinks(UserResponse) })
  async createUser(@Req() req: Request, @Body() body: UserCreateBody): Promise<Omit<UserResponse, "_links">> {
    UserCreateRoute.canOrThrow(req, undefined);

    return this.userService.createUser(body);
  }

  @Get(":id")
  @AcLinks(UserReadRoute)
  @ApiResponse({ type: WithLinks(UserResponse) })
  async getUser(@Req() req: Request, @Param("id") id: number): Promise<Omit<UserResponse, "_links">> {
    const user = await this.userRepository.findOne({ where: { id }, relations: ["member"] });
    if (!user) throw new NotFoundException();

    UserReadRoute.canOrThrow(req, user);

    return user;
  }

  @Patch(":id")
  @AcLinks(UserEditRoute)
  @ApiResponse({ status: 204 })
  async updateUser(@Req() req: Request, @Param("id") id: number, @Body() body: UserUpdateBody): Promise<void> {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException();

    UserEditRoute.canOrThrow(req, user);

    await this.userService.updateUser(id, body);
  }

  @Delete(":id")
  @AcLinks(UserDeleteRoute)
  @ApiResponse({ status: 204 })
  async deleteUser(@Req() req: Request, @Param("id") id: number): Promise<void> {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException();

    UserDeleteRoute.canOrThrow(req, user);

    await this.userService.deleteUser(id);
  }

  @Put(":id/password")
  @AcLinks(UserSetPassword)
  @ApiResponse({ status: 204 })
  async setUserPassword(
    @Req() req: Request,
    @Param("id") id: number,
    @Body() body: UserSetPasswordBody,
  ): Promise<void> {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException();

    UserSetPassword.canOrThrow(req, user);

    await this.userService.updateUser(id, body);
  }

  @Post(":id/impersonate")
  @AcLinks(UserImpersonateRoute)
  async impersonateUser(@Req() req: Request, @Param("id") id: number) {
    const user = await this.userService.getUser(id);
    if (!user) throw new NotFoundException();

    UserImpersonateRoute.canOrThrow(req, user);

    //TODO: implement
  }
}
