import { Controller, Get, NotFoundException, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Token } from "src/auth/decorators/token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { TokenData } from "src/auth/schema/user-token";
import { UsersService } from "src/models/users/services/users.service";
import { AccountReadRoute } from "../acl/account.acl";

@Controller("account")
@UseGuards(UserGuard)
@ApiTags("Account")
@AcController()
export class AccountController {
  constructor(private userService: UsersService) {}

  @Get()
  @AcLinks(AccountReadRoute)
  @ApiResponse({ type: WithLinks(UserResponse) })
  async getMe(@Req() req: Request, @Token() token: TokenData): Promise<UserResponse> {
    const user = await this.userService.getUser(token.userId);
    if (!user) throw new NotFoundException();

    AccountReadRoute.canOrThrow(req, user);

    return user;
  }
}
