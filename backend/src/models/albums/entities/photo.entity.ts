import { User } from "src/models/users/entities/user.entity";
import { Column, Entity, JoinColumn, ManyToOne, OneToMany, PrimaryGeneratedColumn } from "typeorm";
import { Album } from "./album.entity";
import { PhotoFace } from "./photo-face.entity";

export enum AlbumStatus {
  "public" = "public",
  "draft" = "draft",
}

@Entity("photos")
export class Photo {
  @PrimaryGeneratedColumn()
  id!: number;

  @Column({ nullable: false })
  albumId!: number;

  @ManyToOne(() => Album, { onDelete: "RESTRICT", onUpdate: "CASCADE" })
  @JoinColumn({ name: "albumId" })
  album?: Album;

  @Column()
  uploadedById!: number | null;

  @ManyToOne(() => User, { onDelete: "SET NULL", onUpdate: "CASCADE" })
  @JoinColumn({ name: "uploaded_by_id" })
  uploadedBy?: User;

  @OneToMany(() => PhotoFace, (pf) => pf.photo)
  faces?: PhotoFace[];

  @Column({ type: "text" }) title!: string | null;
  @Column({ type: "text" }) name!: string | null;
  @Column({ type: "text" }) caption!: string | null;
  @Column({ type: "integer" }) width!: number | null;
  @Column({ type: "integer" }) height!: number | null;
  @Column({ type: "timestamp with time zone" }) timestamp!: Date | null;
  @Column({ type: "varchar", array: true }) tags!: string[] | null;
  @Column({ type: "varchar" }) bg!: string | null;
}
