import { Entity, Column, ManyToOne, JoinColumn } from 'typeorm';
import { BaseEntity } from './base.entity';
import { Subscriber } from './subscriber.entity';
import { Topic } from './topic.entity';

@Entity()
export class Subscription extends BaseEntity {

  @ManyToOne(() => Subscriber, { eager: true })
  subscriber: Subscriber;
  
  @ManyToOne(() => Topic, { eager: true })
  topic: Topic

  @Column({unique: true})
  subscriberAndTopic: string;
}
