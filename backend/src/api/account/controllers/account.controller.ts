import { Controller, Get, NotFoundException, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController } from "src/access-control/access-control-lib/decorators/ac-controller.decorator";
import { AcLinks } from "src/access-control/access-control-lib/decorators/ac-links.decorator";
import { UserResponse } from "src/api/users/dto/user.dto";
import { UserToken } from "src/auth/decorators/user-token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { UserTokenData } from "src/auth/schema/user-token-data";
import { User } from "src/models/users/entities/user.entity";
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
  @ApiResponse({ type: UserResponse })
  async getMe(@Req() req: Request, @UserToken() token: UserTokenData): Promise<Omit<User, "_links">> {
    const user = await this.userService.getUser(token.userId);
    if (!user) throw new NotFoundException();

    AccountReadRoute.canOrThrow(req, user);

    return user;
  }
}
