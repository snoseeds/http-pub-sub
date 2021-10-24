import { Entity, Column, ManyToOne } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Topic } from './topic.entity';
import { EventStatus } from '../enum/event-status.enum'

@Entity()
export class Event extends BaseEntity {
  @Column()
  statusCode: EventStatus;

  @Column({ type: 'varchar' })
  dataJSON: string;
    
  @ManyToOne(() => Topic, { eager: true })
  topic: Topic

  @Column({ type: 'int', default: null })
  totalNoOfSubscribers: number;

  @Column({ type: 'int', default: null })
  numPendingPublish: number;

  @Column({ type: 'int', default: null })
  numPublishedSuccessfully: number;

  @Column({ type: 'int', default: null })
  numPublishedUnsuccessfully: number;
}
