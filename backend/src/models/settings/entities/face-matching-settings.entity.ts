import { Column, Entity, PrimaryGeneratedColumn } from "typeorm";

@Entity("face_matching_settings")
export class FaceMatchingSettings {
	@PrimaryGeneratedColumn() id!: number;

	@Column({ type: "real", nullable: false, default: 0.5 }) threshold!: number;
}
