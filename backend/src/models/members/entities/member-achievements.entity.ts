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

  @ManyToOne(() => Member, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ type: "enum", enum: MemberAchievementType, nullable: false }) type!: MemberAchievementType;
  @Column({ type: "date", nullable: true }) dateFrom!: string;
  @Column({ type: "date", nullable: true }) dateTill!: string;
}
