import { Body, Controller, Logger, NotFoundException, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { getMemberTrainingTitle } from "src/models/members/helpers/member-badge-titles";
import { MemberTrainingsRepository } from "src/models/members/repositories/member-trainings.repository";
import { NotificationsService } from "src/models/notifications/services/notifications.service";
import { MemberTrainingsBulkCreatePermission } from "../acl/member-trainings.acl";
import { MemberTrainingResponse, MemberTrainingsBulkCreateBody } from "../dto/member-training.dto";

@Controller("member-trainings")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberTrainingsBulkController {
	private readonly logger = new Logger(MemberTrainingsBulkController.name);

	constructor(
		private memberTrainings: MemberTrainingsRepository,
		private notificationsService: NotificationsService,
	) {}

	@Post()
	@AcLinks(MemberTrainingsBulkCreatePermission)
	@ApiResponse({ type: WithLinks(MemberTrainingResponse), isArray: true })
	async createMembersTrainings(
		@Req() req: Request,
		@Body() body: MemberTrainingsBulkCreateBody,
	): Promise<MemberTrainingResponse[]> {
		MemberTrainingsBulkCreatePermission.canOrThrow(req);

		const trainings = await this.memberTrainings.createTrainingsForMembers(body.memberIds, {
			type: body.type,
			name: body.name ?? null,
			issuedOn: body.issuedOn ?? null,
			validUntil: body.validUntil ?? null,
			issuer: body.issuer ?? null,
		});
		if (!trainings) throw new NotFoundException("Někteří členové neexistují.");

		for (const training of trainings) {
			this.notificationsService
				.onMemberBadgeChanged(
					training.memberId,
					{ category: "training", kind: "added", title: getMemberTrainingTitle(training) },
					req.user?.userId,
				)
				.catch((err) => this.logger.error(`Failed to send training notification: ${err.message}`));
		}

		return trainings;
	}
}
