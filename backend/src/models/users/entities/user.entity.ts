import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, JoinColumn, OneToOne, PrimaryGeneratedColumn } from "typeorm";

export enum UserRoles {
  "vedouci" = "vedouci",
  "clen" = "clen",
}

@Entity("users")
export class User {
  @PrimaryGeneratedColumn()
  id!: string;

  @Column()
  memberId!: number | null;

  @OneToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member | null;

  @Column({ type: "varchar", unique: true }) login!: string;
  @Column({ type: "varchar" }) password!: string | null;
  @Column({ type: "varchar", nullable: false, unique: true }) email!: string;
  @Column({ type: "enum", enum: UserRoles, array: true }) roles!: UserRoles[] | null;
  @Column({ type: "varchar", unique: true }) loginCode!: string | null;
  @Column({ type: "timestamp with time zone" }) loginCodeExp!: Date | null;
}
