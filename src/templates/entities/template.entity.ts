import { User } from 'src/users/entities/user.entity';
import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  ManyToOne,
  CreateDateColumn,
  UpdateDateColumn,
} from 'typeorm';

@Entity()
export class Template {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;

  @Column({ type: 'varchar' })
  filePath: string; // ✅ Asl PDF fayl yo‘li

  @Column({ type: 'varchar', nullable: true })
  redactedFilePath?: string; // ✅ Redakt qilingan versiya (Agar bo‘lsa)

  @Column('json', { nullable: true })
  placeholders: Record<string, string>;

  @ManyToOne(() => User, (user) => user.templates, { onDelete: 'CASCADE' })
  user: User;

  @CreateDateColumn()
  createdAt: Date;

  @UpdateDateColumn()
  updatedAt: Date;
}
