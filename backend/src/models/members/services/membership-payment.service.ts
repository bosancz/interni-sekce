import { Injectable } from "@nestjs/common";
import { currentMembershipYear } from "src/helpers/membership";
import { getVariableSymbol } from "src/helpers/variable-symbol";
import { PaymentSettingsRepository } from "src/models/settings/repositories/payment-settings.repository";
import { Member } from "../entities/member.entity";
import { MembershipPayment } from "../entities/membership-payment.entity";
import { MembersRepository } from "../repositories/members.repository";

/**
 * The values of a recorded fee the treasurer writes themselves. Everything else a payment carries
 * is derived here rather than sent by the client — the variable symbol from the member and the
 * season — so a client cannot book a member in under a symbol of its own choosing. Undefined
 * leaves a value as it is; null clears it.
 */
export interface MembershipPaymentValues {
	paidOn?: string | null;
	note?: string | null;
	amount?: number | null;
}

@Injectable()
export class MembershipPaymentService {
	constructor(
		private readonly members: MembersRepository,
		private readonly paymentSettings: PaymentSettingsRepository,
	) {}

	/**
	 * Record the fee of `year` as paid, optionally with the values the treasurer writes on it.
	 *
	 * Recording a fee that is already recorded is not recording it again: what is stored wins over
	 * what today would derive, so the symbol it was paid under survives — this is also the way the
	 * day of the payment, a note or an amount is edited. A fee recorded for the first time takes
	 * the club's fee from the payment settings, so a season ticked off says what it was worth
	 * without the treasurer typing anything; the day it was paid on nothing can know, so it stays
	 * empty until someone fills it in.
	 */
	async setPaid(
		member: Member,
		year: number = currentMembershipYear(),
		values: MembershipPaymentValues = {},
	): Promise<MembershipPayment> {
		const recorded = await this.members.getMembershipPayment(member.id, year);

		const payment = await this.members.createMembershipPayment({
			memberId: member.id,
			forYear: year,
			variableSymbol: recorded?.variableSymbol ?? getVariableSymbol(member, year),
			paidOn: values.paidOn === undefined ? (recorded?.paidOn ?? null) : this.normalizeDate(values.paidOn),
			note: values.note === undefined ? (recorded?.note ?? null) : this.normalizeNote(values.note),
			amount: values.amount === undefined ? await this.recordedAmount(recorded) : values.amount,
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

	/**
	 * The amount a fee keeps when the caller sends none: the one already recorded, or — the first
	 * time the season is ticked off — the club's fee as the payment settings have it. A fee
	 * migrated from the old list of years has no amount and is left without one; only recording it
	 * anew gives it the settings' fee.
	 */
	private async recordedAmount(recorded: MembershipPayment | null): Promise<number | null> {
		if (recorded) return recorded.amount ?? null;

		return (await this.paymentSettings.getPaymentSettings()).amount;
	}

	/** A note is text or it is nothing — whitespace and an empty box are stored as no note at all. */
	private normalizeNote(note: string | null): string | null {
		return note?.trim() || null;
	}

	/** An emptied date box is no date at all, the way an emptied note is no note. */
	private normalizeDate(date: string | null): string | null {
		return date?.trim() || null;
	}
}
