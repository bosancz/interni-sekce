import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { BoardMember } from "../entities/board-member.entity";

export const DEFAULT_BOARD_FUNCTION = "člen vedení";

@Injectable()
export class BoardMembersRepository {
	constructor(@InjectRepository(BoardMember) private boardMembersRepository: Repository<BoardMember>) {}

	async getBoardMembers(options: { contacts?: boolean } = {}) {
		const q = this.boardMembersRepository
			.createQueryBuilder("board")
			.innerJoin("board.member", "member")
			.addSelect([
				"member.id",
				"member.nickname",
				"member.firstName",
				"member.lastName",
				"member.profilePhotoUpdatedAt",
			])
			.orderBy("board.position", "ASC", "NULLS LAST")
			.addOrderBy("member.nickname", "ASC");

		if (options.contacts) q.addSelect(["member.email", "member.mobile"]);

		return q.getMany();
	}

	async getBoardMember(memberId: number) {
		return this.boardMembersRepository.findOne({ where: { memberId } });
	}

	async saveBoardMember(memberId: number, data: Partial<Pick<BoardMember, "function">>) {
		const values = Object.fromEntries(Object.entries(data).filter(([, value]) => value !== undefined));

		const existing = await this.getBoardMember(memberId);
		if (existing) {
			if (Object.keys(values).length) await this.boardMembersRepository.update({ memberId }, values);
		} else {
			await this.boardMembersRepository.insert({
				function: DEFAULT_BOARD_FUNCTION,
				...values,
				memberId,
				position: null,
			});
		}
	}

	async setBoardMembersOrder(memberIds: number[]) {
		await this.boardMembersRepository.manager.transaction(async (t) => {
			for (const [position, memberId] of memberIds.entries()) {
				await t.update(BoardMember, { memberId }, { position });
			}
		});
	}

	async deleteBoardMember(memberId: number) {
		await this.boardMembersRepository.delete({ memberId });
	}
}
