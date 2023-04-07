import { Body, Controller, Delete, Get, NotFoundException, Param, Patch, Post, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { AcContent } from "src/access-control/access-control-lib/schema/ac-content";
import { UsersService } from "src/models/users/services/users.service";
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

@Controller("users")
@AcController()
@ApiTags("Users")
export class UsersController {
  constructor(private userService: UsersService) {}

  @Get()
  @AcLinks(UsersListRoute)
  @ApiResponse({ type: UserResponse, isArray: true })
  async listUsers(@Req() req: Request): Promise<AcContent<UserResponse>[]> {
    UsersListRoute.canOrThrow(req, undefined);

    return this.userService.listUsers();
  }

  @Post()
  @AcLinks(UserCreateRoute)
  @ApiResponse({ type: UserResponse })
  async createUser(@Req() req: Request, @Body() body: UserCreateBody): Promise<AcContent<UserResponse>> {
    UserCreateRoute.canOrThrow(req, undefined);

    return this.userService.createUser(body);
  }

  @Get(":id")
  @AcLinks(UserReadRoute)
  @ApiResponse({ type: UserResponse })
  async getUser(@Req() req: Request, @Param("id") id: number): Promise<AcContent<UserResponse>> {
    const user = await this.userService.getUser(id);
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
