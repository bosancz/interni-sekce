import { Controller, Get, HttpCode, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { BadgesService } from "src/models/badges/services/badges.service";
import { AccountBadgesReadPermission, AccountBadgesSeenPermission } from "../acl/account.acl";
import { BadgeResponse } from "../dto/account-badges.dto";

@Controller("account/badges")
@Authenticated()
@ApiTags("Account")
@AcController()
export class AccountBadgesController {
	constructor(private badgesService: BadgesService) {}

	@Get()
	@AcLinks(AccountBadgesReadPermission)
	@ApiResponse({ status: 200, type: BadgeResponse, isArray: true })
	async getMyBadges(@Req() req: Request): Promise<BadgeResponse[]> {
		AccountBadgesReadPermission.canOrThrow(req);

		const memberId = req.user?.memberId ?? null;
		if (memberId !== null) await this.badgesService.evaluate(memberId);

		return this.badgesService.getMemberBadges(memberId);
	}

	@Post("seen")
	@HttpCode(204)
	@AcLinks(AccountBadgesSeenPermission)
	@ApiResponse({ status: 204 })
	async markMyBadgesSeen(@Req() req: Request): Promise<void> {
		AccountBadgesSeenPermission.canOrThrow(req);

		const memberId = req.user?.memberId;
		if (memberId) await this.badgesService.markSeen(memberId);
	}
}
