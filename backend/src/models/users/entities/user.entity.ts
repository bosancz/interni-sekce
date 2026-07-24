import { ApiHideProperty, ApiProperty } from "@nestjs/swagger";
import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

export enum UserRoles {
	"admin" = "admin",
	"revizor" = "revizor",
	"program" = "program",
}

// No @Index on login — @Column({ unique: true }) below already enforces it (constraint
// UQ_2d443082eccd5198f95f2a36e2c); a second unique index would only duplicate it.
@Entity("users")
export class User {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ nullable: true })
	memberId!: number | null;

	@OneToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	member?: Member | null;

	@Column({
		type: "varchar",
		unique: true,
		transformer: { from: (v) => v, to: (v: string) => v.toLocaleLowerCase() },
	})
	login!: string;

	// Diacritic-insensitive haystack for search, maintained by Postgres as a stored generated
	// column (see SearchStringColumns migration). Matched with `searchString ILIKE unaccent(:q)`.
	@Column({
		type: "text",
		nullable: true,
		select: false,
		asExpression: "immutable_unaccent(coalesce(login, ''))",
		generatedType: "STORED",
	})
	@ApiHideProperty()
	searchString?: string;

	@Column({ type: "varchar", nullable: true, select: false }) password!: string | null;
	@Column({ type: "varchar", unique: true }) email!: string | null;

	@Column({ type: "enum", enum: UserRoles, array: true, nullable: true })
	@ApiProperty({ enum: UserRoles, enumName: "UserRolesEnum", isArray: true, nullable: true })
	roles!: UserRoles[] | null;

	@Column({ type: "varchar", unique: true, nullable: true, select: false }) loginCode!: string | null;
	@Column({ type: "timestamp with time zone", nullable: true, select: false }) loginCodeExp!: string | null;
}
