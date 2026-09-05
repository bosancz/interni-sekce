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

	/** Record the fee of `year` as paid, or return the payment already recorded for it. */
	async setPaid(member: Member, year: number = currentMembershipYear()): Promise<MembershipPayment> {
		const payment = await this.members.createMembershipPayment({
			memberId: member.id,
			forYear: year,
			variableSymbol: getVariableSymbol(member, year),
			recordedOn: this.today(),
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
