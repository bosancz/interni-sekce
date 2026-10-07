import { Column, CreateDateColumn, Entity, PrimaryGeneratedColumn, UpdateDateColumn } from "typeorm";

export const PHOTO_CATEGORY_DEFAULT_THRESHOLD = 0.25;

@Entity("photo_categories")
export class PhotoCategory {
	@PrimaryGeneratedColumn()
	id!: number;

	@Column({ type: "varchar", nullable: false, unique: true }) name!: string;
	@Column({ type: "text", array: true, nullable: false, default: () => "'{}'" }) prompts!: string[];
	@Column({ type: "real", nullable: false, default: PHOTO_CATEGORY_DEFAULT_THRESHOLD }) threshold!: number;
	@Column({ type: "integer", nullable: true }) order!: number | null;

	@Column({ type: "bytea", nullable: true, select: false })
	embedding?: Buffer | null;

	@Column({ type: "varchar", nullable: true }) model!: string | null;

	@CreateDateColumn({ type: "timestamp with time zone" }) createdAt!: Date;
	@UpdateDateColumn({ type: "timestamp with time zone" }) updatedAt!: Date;
}
