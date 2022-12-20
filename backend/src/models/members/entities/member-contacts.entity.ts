import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum MemberContactType {
  "mobile" = "mobile",
  "email" = "email",
  "other" = "other",
}

@Entity("members_contacts")
export class MemberContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  memberId!: number;

  @ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ nullable: false }) title!: string;
  @Column({ nullable: false }) type!: MemberContactType;
  @Column({ nullable: false }) contact!: string;
}
