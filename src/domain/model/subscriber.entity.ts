import { Entity, Column } from 'typeorm';
import { BaseEntity } from './base.entity';

@Entity()
export class Subscriber extends BaseEntity {

  @Column({ type: 'varchar', length: 300, unique: true })
  url: string;
}
