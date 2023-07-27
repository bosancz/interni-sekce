import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum MemberContactTypes {
  "mobile" = "mobile",
  "email" = "email",
  "other" = "other",
}

@Entity("members_contacts")
export class MemberContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  memberId!: number;

  @ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ nullable: false }) title!: string;
  @Column({ type: "enum", enum: MemberContactTypes, nullable: false }) type!: MemberContactTypes;
  @Column({ nullable: false }) contact!: string;
}
