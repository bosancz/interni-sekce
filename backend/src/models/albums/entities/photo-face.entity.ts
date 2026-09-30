import { Member } from "src/models/members/entities/member.entity";
import { User } from "src/models/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { FaceEmotion, FaceEmotions } from "../schema/detected-faces";
import { Photo } from "./photo.entity";

@Entity("photo_faces")
export class PhotoFace {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "integer", nullable: false })
	photoId!: number;

	@ManyToOne(() => Photo, { onDelete: "CASCADE", onUpdate: "CASCADE" })
	@JoinColumn({ name: "photo_id" })
	photo?: Photo;

	@Column({ type: "integer", nullable: true })
	memberId!: number | null;

	@ManyToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "member_id" })
	member?: Member | null;

	@Column({ type: "real", nullable: false }) x!: number;
	@Column({ type: "real", nullable: false }) y!: number;
	@Column({ type: "real", nullable: false }) width!: number;
	@Column({ type: "real", nullable: false }) height!: number;
	@Column({ type: "real", nullable: true }) score!: number | null;

	@Column({ type: "real", array: true, nullable: true, select: false })
	descriptor?: number[] | null;

	@Column({ type: "jsonb", nullable: true }) emotions!: FaceEmotions | null;
	@Column({ type: "varchar", nullable: true }) emotion!: FaceEmotion | null;

	@Column({ type: "varchar", nullable: true }) model!: string | null;

	@Column({ type: "integer", nullable: true })
	assignedById!: number | null;

	@ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
	@JoinColumn({ name: "assigned_by_id" })
	assignedBy?: User | null;

	@Column({ type: "timestamp with time zone", nullable: true }) assignedAt!: Date | null;
}
