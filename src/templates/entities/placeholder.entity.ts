import { Entity, PrimaryGeneratedColumn, Column, ManyToOne } from 'typeorm';
import { Template } from './template.entity'; // Make sure it's the correct path

@Entity()
export class Placeholder {
  @PrimaryGeneratedColumn()
  id: number;

  @Column()
  name: string;  // Make sure this is declared

  @Column()
  position: string; // Assuming position is a string, you can adjust as necessary

  @ManyToOne(() => Template, (template) => template.placeholders)
  template: Template; // Relating to Template entity
}
