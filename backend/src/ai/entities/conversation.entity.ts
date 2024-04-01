import { ChatCompletionMessageParam } from "openai/resources";
import { User } from "src/models/users/entities/user.entity";
import { Column, CreateDateColumn, Entity, JoinColumn, ManyToOne, PrimaryGeneratedColumn } from "typeorm";

@Entity("conversations")
export class Conversation {
  @PrimaryGeneratedColumn()
  id!: number;

  @CreateDateColumn()
  createdAt!: Date;

  @Column()
  userId!: number;

  @ManyToOne(() => User)
  @JoinColumn({ name: "userId" })
  user!: User;

  @Column({ type: "jsonb", default: [] })
  messages!: ChatCompletionMessageParam[];
}
