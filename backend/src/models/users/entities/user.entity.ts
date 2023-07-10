import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

export enum UserRoles {
  "admin" = "admin",
  "revizor" = "revizor",
  "program" = "program",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: true })
  memberId!: number | null;

  @OneToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member | null;

  @Column({ type: "varchar", unique: true }) login!: string;
  @Column({ type: "varchar", nullable: true, select: false }) password!: string | null;
  @Column({ type: "varchar", unique: true }) email!: string | null;
  @Column({ type: "enum", enum: UserRoles, array: true, nullable: true }) roles!: UserRoles[] | null;
  @Column({ type: "varchar", unique: true, nullable: true, select: false }) loginCode!: string | null;
  @Column({ type: "timestamp with time zone", nullable: true, select: false }) loginCodeExp!: string | null;
}
