import { Topic } from 'src/domain/model/topic.entity';
import { EntityRepository, Repository } from 'typeorm';
import { Event } from '../domain/model/event.entity';
import { EventStatus } from '../domain/enum/event-status.enum';


@EntityRepository(Event)
export class EventRepository extends Repository<Event> {

  async createEvent (statusCode: EventStatus, dataJSON: string, topic: Topic, totalNoOfSubscribers: number) {
    const newEvent = {
      statusCode,
      dataJSON,
      topic,
      totalNoOfSubscribers,
      numPendingPublish: totalNoOfSubscribers
    };
    return this.save(newEvent);
  }

  updateEventStatus(
    event: Event,
    eventProps: {
      statusCode?: EventStatus,
      numPendingPublish?: number,
      numPublishedSuccessfully?: number,
      numPublishedUnsuccessfully?: number
    }): Promise<Event> {
    return this.save({
      ...event,
      ...eventProps
    });
  }
}