import { Member } from "src/models/members/entities/member.entity";
import { Column, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";
import { Photo } from "./photo.entity";

@Entity("photo_faces")
export class PhotoFace {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ type: "integer", nullable: false })
  photoId!: number;

  @ManyToOne(() => Photo, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "photo_id" })
  photo?: Photo;

  @Column({ type: "integer", nullable: true })
  memberId!: number | null;

  @ManyToOne(() => Member, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "member_id" })
  member?: Member;

  @Column({ type: "integer", array: true, nullable: false })
  location!: number[];

  @Column({ type: "cube", nullable: false })
  descriptor!: number[];
}
