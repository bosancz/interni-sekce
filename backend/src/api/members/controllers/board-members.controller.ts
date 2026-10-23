import { Body, Controller, Delete, Get, NotFoundException, Param, ParseIntPipe, Put, Req } from "@nestjs/common";
import { ApiResponse, ApiTags } from "@nestjs/swagger";
import { Request } from "express";
import { AcController, AcLinks, WithLinks } from "src/access-control/access-control-lib";
import { Authenticated } from "src/auth/decorators/authenticated.decorator";
import { BoardMembersRepository } from "src/models/members/repositories/board-members.repository";
import { MembersRepository } from "src/models/members/repositories/members.repository";
import {
	BoardMemberDeletePermission,
	BoardMemberSavePermission,
	BoardMembersListPermission,
	BoardMembersOrderPermission,
} from "../acl/board-members.acl";
import { BoardMemberResponse, BoardMembersOrderBody, BoardMemberUpdateBody } from "../dto/board-member.dto";

@Controller("board-members")
@Authenticated()
@AcController()
@ApiTags("Members")
export class BoardMembersController {
	constructor(
		private boardMembers: BoardMembersRepository,
		private members: MembersRepository,
	) {}

	@Get()
	@AcLinks(BoardMembersListPermission)
	@ApiResponse({ status: 200, type: WithLinks(BoardMemberResponse), isArray: true })
	async listBoardMembers(@Req() req: Request): Promise<BoardMemberResponse[]> {
		BoardMembersListPermission.canOrThrow(req);

		return this.boardMembers.getBoardMembers({ contacts: true });
	}

	@Put()
	@AcLinks(BoardMembersOrderPermission)
	@ApiResponse({ status: 204 })
	async updateBoardMembersOrder(@Req() req: Request, @Body() body: BoardMembersOrderBody): Promise<void> {
		BoardMembersOrderPermission.canOrThrow(req);

		await this.boardMembers.setBoardMembersOrder(body.memberIds);
	}

	@Put(":memberId")
	@AcLinks(BoardMemberSavePermission)
	@ApiResponse({ status: 204 })
	async saveBoardMember(
		@Req() req: Request,
		@Param("memberId", ParseIntPipe) memberId: number,
		@Body() body: BoardMemberUpdateBody,
	): Promise<void> {
		BoardMemberSavePermission.canOrThrow(req);

		if (!(await this.members.getMember(memberId))) throw new NotFoundException();

		await this.boardMembers.saveBoardMember(memberId, { function: body.function?.trim() || undefined });
	}

	@Delete(":memberId")
	@AcLinks(BoardMemberDeletePermission)
	@ApiResponse({ status: 204 })
	async deleteBoardMember(@Req() req: Request, @Param("memberId", ParseIntPipe) memberId: number): Promise<void> {
		const boardMember = await this.boardMembers.getBoardMember(memberId);
		if (!boardMember) throw new NotFoundException();

		BoardMemberDeletePermission.canOrThrow(req, boardMember);

		await this.boardMembers.deleteBoardMember(memberId);
	}
}
