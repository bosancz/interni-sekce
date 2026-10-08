import { PHOTO_EMBEDDING_DIMENSION } from "../helpers/photo-embeddings";
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

	@Column({ type: "vector", length: PHOTO_EMBEDDING_DIMENSION, nullable: true, select: false })
	embedding?: number[] | null;

	@Column({ type: "varchar", nullable: true }) model!: string | null;

	@CreateDateColumn({ type: "timestamp with time zone" }) createdAt!: Date;
	@UpdateDateColumn({ type: "timestamp with time zone" }) updatedAt!: Date;
}
