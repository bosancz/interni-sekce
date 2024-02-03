import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

@Entity("members_contacts")
export class MemberContact {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  memberId!: number;

  @ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ type: "varchar", nullable: false }) title!: string;
  @Column({ type: "varchar", nullable: true }) mobile?: string;
  @Column({ type: "varchar", nullable: true }) email?: string;
  @Column({ type: "text", nullable: true }) other?: string;
}
