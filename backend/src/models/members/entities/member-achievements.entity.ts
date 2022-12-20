import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Member } from "./member.entity";

export enum MemberAchievementType {
  "star" = "star",
  "certificate" = "certificate",
  "other" = "other",
}

@Entity("members_achievements")
export class MemberAchievement {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column()
  memberId!: number;

  @ManyToOne(() => Member, { onDelete: "CASCADE", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ nullable: false, enum: MemberAchievementType }) type!: MemberAchievementType;
  @Column({ nullable: true, type: "date" }) dateFrom!: string;
  @Column({ nullable: true, type: "date" }) dateTill!: string;
}
