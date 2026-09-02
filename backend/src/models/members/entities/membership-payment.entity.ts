import { ApiHideProperty } from "@nestjs/swagger";
import { Column, Entity, Index, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

/**
 * One membership fee ("členský příspěvek") a member has paid, for one season.
 *
 * It replaces the plain list of years `Member.membership` used to be: the treasurer needs to see
 * what was actually paid — under which variable symbol, how much and when — not only that some
 * year is ticked off. The membership of a year is "zaplaceno" exactly when a row for that year
 * exists, so recording a fee means inserting one and un-recording it means deleting it; there is
 * no separate paid flag that could disagree with the payment.
 *
 * A member has at most one payment per season, enforced by the unique (member_id, for_year) index
 * rather than left to the callers — see helpers/membership.ts for the readers.
 */
@Entity("membership_payments")
@Index("UQ_membership_payments_member_year", ["memberId", "forYear"], { unique: true })
export class MembershipPayment {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: false })
	memberId!: Member["id"];

	@ManyToOne(() => Member, (member) => member.membership, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	@ApiHideProperty()
	member?: Member;

	/** The season the fee is paid for — the year the treasurer had on screen when recording it. */
	@Column({ type: "smallint", nullable: false })
	forYear!: number;

	/**
	 * Variable symbol the payment came in under, derived by `getVariableSymbol()` from the member
	 * and the season. Stored rather than derived on read so a payment still shows the symbol it
	 * was actually made with, should the derivation ever change.
	 */
	@Column({ type: "varchar", nullable: false })
	variableSymbol!: string;

	/** Amount in whole currency units, taken from the payment settings when the fee is recorded. */
	@Column({ type: "integer", nullable: false })
	amount!: number;

	/**
	 * The day the fee was recorded. Nullable because the fees migrated from the old list of years
	 * carry no date — nothing recorded one back then.
	 */
	@Column({ type: "date", nullable: true })
	date?: string | null;
}
