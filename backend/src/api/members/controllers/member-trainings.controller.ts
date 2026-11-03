import {
	BadRequestException,
	Body,
	Controller,
	Delete,
	Get,
	NotFoundException,
	Param,
	ParseIntPipe,
	Patch,
	Post,
	Req,
} from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { MemberTrainingTypes } from "src/models/members/entities/member-training.entity";
import { MemberTrainingsRepository } from "src/models/members/repositories/member-trainings.repository";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	MemberTrainingCreatePermission,
	MemberTrainingDeletePermission,
	MemberTrainingsListPermission,
	MemberTrainingUpdatePermission,
} from "../acl/member-trainings.acl";
import { MemberTrainingCreateBody, MemberTrainingResponse, MemberTrainingUpdateBody } from "../dto/member-training.dto";

@Controller("members/:memberId/trainings")
@Authenticated()
@AcController()
@ApiTags("Members")
export class MemberTrainingsController {
	constructor(
		private membersRepository: MembersRepository,
		private memberTrainings: MemberTrainingsRepository,
	) {}

	@Get()
	@AcLinks(MemberTrainingsListPermission)
	@ApiResponse({ status: 200, type: WithLinks(MemberTrainingResponse), isArray: true })
	async listMemberTrainings(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
	): Promise<MemberTrainingResponse[]> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberTrainingsListPermission.canOrThrow(req, member);

		return this.memberTrainings.getTrainings(member.id);
	}

	@Post()
	@AcLinks(MemberTrainingCreatePermission)
	@ApiResponse({ type: WithLinks(MemberTrainingResponse) })
	async createMemberTraining(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: MemberTrainingCreateBody,
	): Promise<MemberTrainingResponse> {
		const member = await this.membersRepository.getMember(memberId);
		if (!member) throw new NotFoundException();

		MemberTrainingCreatePermission.canOrThrow(req, member);

		return this.memberTrainings.createTraining(member.id, {
			type: body.type,
			name: body.name ?? null,
			issuedOn: body.issuedOn ?? null,
			validUntil: body.validUntil ?? null,
			issuer: body.issuer ?? null,
		});
	}

	@Patch(":trainingId")
	@AcLinks(MemberTrainingUpdatePermission)
	@ApiResponse({ type: WithLinks(MemberTrainingResponse) })
	async updateMemberTraining(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("trainingId", ParseIntPipe) trainingId: number,
		@Body() body: MemberTrainingUpdateBody,
	): Promise<MemberTrainingResponse> {
		const training = await this.memberTrainings.getTraining(memberId, trainingId);
		if (!training) throw new NotFoundException();

		MemberTrainingUpdatePermission.canOrThrow(req, training);

		if (training.type === MemberTrainingTypes.custom && body.name === null) {
			throw new BadRequestException("Vlastní školení musí mít název.");
		}

		return this.memberTrainings.updateTraining(training, {
			name: body.name,
			issuedOn: body.issuedOn,
			validUntil: body.validUntil,
			issuer: body.issuer,
		});
	}

	@Delete(":trainingId")
	@AcLinks(MemberTrainingDeletePermission)
	async deleteMemberTraining(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Param("trainingId", ParseIntPipe) trainingId: number,
	): Promise<void> {
		const training = await this.memberTrainings.getTraining(memberId, trainingId);
		if (!training) throw new NotFoundException();

		MemberTrainingDeletePermission.canOrThrow(req, training);

		await this.memberTrainings.deleteTraining(memberId, trainingId);
	}
}
