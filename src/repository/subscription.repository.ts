import { EntityRepository, Repository } from 'typeorm';
import { Subscription } from '../domain/model/subscription.entity';
import { Subscriber } from '../domain/model/subscriber.entity';
import { Topic } from '../domain/model/topic.entity';



@EntityRepository(Subscription)
export class SubscriptionRepository extends Repository<Subscription> {

  findByTopicID(topicId: string) {
    return this.find({
      where: { topic: topicId }
    })
  }

  findByCompoundKey(subscriberIdAndTopicId: string) {
    return this.findOne({
      where: { subscriberAndTopic: subscriberIdAndTopicId }
    })
  }

  async createNewSubscription(subscriber: Subscriber, topic: Topic) {
    const newSubscription = {
      subscriber,
      topic,
      subscriberAndTopic: `${subscriber.id}${topic.id}`
    }
    return this.save(newSubscription);
  }
}