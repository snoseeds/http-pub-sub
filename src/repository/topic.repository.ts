import { EntityRepository, Repository } from 'typeorm';
import { Topic } from '../domain/model/topic.entity';

@EntityRepository(Topic)
export class TopicRepository extends Repository<Topic> {

  findByName(topic: string) {
    return this.findOne({
      name: topic
    });
  }

  async incrementPublishedEventsCount(topic: Topic): Promise<Topic> {
    const topicLiveRecord = await this.findOne({
      where: { id: topic.id }
    });
    
    return this.save({
      ...topicLiveRecord,
      publishedEventsCount: topicLiveRecord.publishedEventsCount + 1
    });
  }

  async createNewTopic(topic: string) {
    const newTopic = new Topic();
    newTopic.name = topic;
    return this.save(newTopic);
  }
}