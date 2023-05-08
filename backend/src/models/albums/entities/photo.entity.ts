import { User } from "src/models/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Album } from "./album.entity";
import { PhotoFace } from "./photo-face.entity";

@Entity("photos")
export class Photo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  albumId!: number;

  @ManyToOne(() => Album, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "album_id" })
  album?: Album;

  @Column({ nullable: true })
  uploadedById!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "uploaded_by_id" })
  uploadedBy?: User;

  @OneToMany(() => PhotoFace, (pf) => pf.photo)
  faces?: PhotoFace[];

  @Column({ type: "text", nullable: false }) name!: string;
  @Column({ type: "timestamp with time zone", nullable: false }) timestamp!: Date;
  @Column({ type: "integer", nullable: true }) width!: number | null;
  @Column({ type: "integer", nullable: true }) height!: number | null;
  @Column({ type: "text", nullable: true }) title!: string | null;
  @Column({ type: "text", nullable: true }) caption!: string | null;
  @Column({ type: "varchar", array: true, nullable: true }) tags!: string[] | null;
  @Column({ type: "varchar", nullable: true }) bg!: string | null;
}
