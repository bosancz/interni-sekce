import { Injectable } from "@nestjs/common";
import { currentMembershipYear } from "src/helpers/membership";
import { getVariableSymbol } from "src/helpers/variable-symbol";
import { Member } from "../entities/member.entity";
import { MembershipPayment } from "../entities/membership-payment.entity";
import { MembersRepository } from "../repositories/members.repository";

/**
 * The membership fee of one season, written the only way it is ever written: the treasurer says a
 * member has paid (or has not), and everything the payment carries is derived here rather than
 * sent by the client — the variable symbol from the member and the season, the day it is recorded
 * from today. That keeps the recorded fee honest: a client cannot book a member in under a symbol
 * of its own choosing.
 *
 * What is deliberately not recorded is how much came in — see the entity for why the club's fee is
 * not a number this table can know.
 */
@Injectable()
export class MembershipPaymentService {
	constructor(private readonly members: MembersRepository) {}

	/**
	 * Record the fee of `year` as paid, optionally with the treasurer's note on it.
	 *
	 * Recording a fee that is already recorded is not recording it again: what is stored wins over
	 * what today would derive, so the symbol it was paid under and the day it was written down
	 * survive — this is also the way a note is edited (the only value the caller can change). Pass
	 * `note` as undefined to leave the note alone, `null` or an empty string to clear it.
	 */
	async setPaid(
		member: Member,
		year: number = currentMembershipYear(),
		note?: string | null,
	): Promise<MembershipPayment> {
		const recorded = await this.members.getMembershipPayment(member.id, year);

		const payment = await this.members.createMembershipPayment({
			memberId: member.id,
			forYear: year,
			variableSymbol: recorded?.variableSymbol ?? getVariableSymbol(member, year),
			// A fee migrated from the old list of years has no date and does not get one now — only
			// a fee recorded here and now is dated, which is what the column claims to say.
			recordedOn: recorded ? (recorded.recordedOn ?? null) : this.today(),
			note: note === undefined ? (recorded?.note ?? null) : this.normalizeNote(note),
		});

		// upsert() writes the row and the read back is by its unique key, so it is always there.
		return payment!;
	}

	/** Every fee this member has paid, newest season first. */
	async getMembership(member: Member): Promise<MembershipPayment[]> {
		return this.members.getMembershipPayments(member.id);
	}

	/** Drop the fee of `year`; a season that was never paid is left alone. */
	async setUnpaid(member: Member, year: number = currentMembershipYear()): Promise<void> {
		await this.members.deleteMembershipPayment(member.id, year);
	}

	/** A note is text or it is nothing — whitespace and an empty box are stored as no note at all. */
	private normalizeNote(note: string | null): string | null {
		return note?.trim() || null;
	}

	/** Today as a `date` column takes it (YYYY-MM-DD), in the server's own timezone. */
	private today(): string {
		const now = new Date();

		return [
			now.getFullYear(),
			String(now.getMonth() + 1).padStart(2, "0"),
			String(now.getDate()).padStart(2, "0"),
		].join("-");
	}
}
