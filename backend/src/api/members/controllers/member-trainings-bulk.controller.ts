import { Body, Controller, NotFoundException, Post, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MemberTrainingsRepository } from "src/models/members/repositories/member-trainings.repository";
import { MemberTrainingsBulkCreatePermission } from "../acl/member-trainings.acl";
import { MemberTrainingResponse, MemberTrainingsBulkCreateBody } from "../dto/member-training.dto";

@Controller("member-trainings")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberTrainingsBulkController {
	constructor(private memberTrainings: MemberTrainingsRepository) {}

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

		return trainings;
	}
}
