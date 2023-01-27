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
  @Column({ type: "varchar", nullable: true }) password!: string | null;
  @Column({ type: "varchar", unique: true }) email!: string | null;
  @Column({ type: "enum", enum: UserRoles, array: true }) roles!: UserRoles[] | null;
  @Column({ type: "varchar", unique: true, nullable: true }) loginCode!: string | null;
  @Column({ type: "timestamp with time zone", nullable: true }) loginCodeExp!: Date | null;
}
