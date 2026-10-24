import { Body, Controller, Get, HttpCode, NotFoundException, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { UserResponse } from "src/api/users/dto/user.dto";
import { AuthUser } from "src/auth/decorators/auth-user.decorator";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { SessionUser } from "src/auth/schema/user-token";
import { UsersRepository } from "src/models/users/repositories/users.repository";
import {
	AccountReadPermission,
	AccountSettingsReadPermission,
	AccountSettingsUpdatePermission,
} from "../acl/account.acl";
import { AccountSettingsBody, AccountSettingsResponse } from "../dto/account-settings.dto";
import { AccountResponse } from "../dto/account.dto";

@Controller("account")
@Authenticated()
@ApiTags("Account")
@AcController()
export class AccountController {
	constructor(private usersRepository: UsersRepository) {}

	@Get()
	@AcLinks(AccountReadPermission)
	@ApiResponse({ status: 200, type: WithLinks(UserResponse, AccountResponse) })
	async getMe(@Req() req: Request, @AuthUser() authUser: SessionUser): Promise<AccountResponse> {
		const user = await this.usersRepository.getUser(authUser.userId, { includeMember: true });
		if (!user) throw new NotFoundException();

		AccountReadPermission.canOrThrow(req, user);

		return user as AccountResponse;
	}

	@Get("settings")
	@AcLinks(AccountSettingsReadPermission)
	@ApiResponse({ status: 200, type: AccountSettingsResponse })
	async getMySettings(@Req() req: Request, @AuthUser() authUser: SessionUser): Promise<AccountSettingsResponse> {
		AccountSettingsReadPermission.canOrThrow(req);

		return { settings: await this.usersRepository.getUserSettings(authUser.userId) };
	}

	@Put("settings")
	@HttpCode(204)
	@AcLinks(AccountSettingsUpdatePermission)
	@ApiResponse({ status: 204 })
	async setMySettings(
		@Req() req: Request,
		@AuthUser() authUser: SessionUser,
		@Body() body: AccountSettingsBody,
	): Promise<void> {
		AccountSettingsUpdatePermission.canOrThrow(req);

		await this.usersRepository.setUserSettings(authUser.userId, body.settings);
	}
}
