import { Controller, Get, NotFoundException, Req, UseGuards } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { Token } from "src/auth/decorators/token.decorator";
import { UserGuard } from "src/auth/guards/user.guard";
import { TokenData } from "src/auth/schema/user-token";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import { AccountReadPermission } from "../acl/account.acl";
import { AccountResponse } from "../dto/account.dto";

@Controller("account")
@UseGuards(UserGuard)
@ApiTags("Account")
@AcController()
export class AccountController {
	constructor(private userService: UsersRepository) {}

	@Get()
	@AcLinks(AccountReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse, AccountResponse) })
	async getMe(@Req() req: Request, @Token() token: TokenData): Promise<AccountResponse> {
		const user = await this.userService.getUser(token.userId, { includeMember: true });
		if (!user) throw new NotFoundException();

		AccountReadPermission.canOrThrow(req, user);

		return user as AccountResponse;
	}
}
