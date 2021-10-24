import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Topic extends BaseEntity {

  @Column({ type: 'varchar', length: 300, unique: true })
  name: string;

  @Column({type: 'int', default: 0})
  publishedEventsCount: number;
}
