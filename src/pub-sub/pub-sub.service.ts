import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Subscriber } from '../domain/model/subscriber.entity';
import { Topic } from '../domain/model/topic.entity';
import { TopicRepository } from '../repository/topic.repository';
import { EventRepository } from '../repository/event.repository';
import { Subscription } from '../domain/model/subscription.entity';
import { EventStatusDto } from '../domain/dto/event-status.dto';
import { SubscriberPublishResult } from '../domain/types/subscriber-publish-result';
import { AllSettledPromiseIndividualResult } from '../domain/types/all-settled-promise-individual-result';
import { Event } from '../domain/model/event.entity';
import { EventStatus } from '../domain/enum/event-status.enum';
const axios = require('axios');
import fs = require('fs');
import { join } from 'path'

@Injectable()
export class PubSubService {

  constructor(
    @InjectRepository(TopicRepository) private readonly topicRepo: TopicRepository,
    @InjectRepository(EventRepository) private readonly eventRepo: EventRepository,
  ) {}

  public static async dispatchEventsConcurrently(recipients: string[], message: object): Promise<AllSettledPromiseIndividualResult[]> {
    const dispatchesPromise: Promise<SubscriberPublishResult>[] = [];
    // Dispatching the events concurrentl
    for (let webHookUrl of recipients) {
      dispatchesPromise.push(
        (async function asyncFunc (): Promise<SubscriberPublishResult> {
          try {
            const { data } = await axios.post(
                webHookUrl,
                message
              )
            return {
              webHookUrl,
              data
            }
          } catch (error) {
            const { name, message } = error.toJSON();
            throw {
              webHookUrl,
              error: `${name}: ${message}`
            }
          }
        })()
      );
    }
    const results: AllSettledPromiseIndividualResult[] = await Promise.allSettled(dispatchesPromise);
    return results;
  }

  public static getEnumNameFromEnumValue(enumObj: object, enumValue: any):  string {
    return Object.entries(enumObj)
      .filter(([enumName, enumVal]) => enumVal === enumValue)[0][0];
  }
  private static getStatus(totalCount: number, successCount: number, failureCount: number): { statusCode: EventStatus } {
    if (totalCount === successCount) {
      return {
        statusCode: EventStatus.ALL_SUCCESSFUL
      }
    } else if (totalCount === failureCount) {
      return {
        statusCode: EventStatus.ALL_NOT_AVAILABLE
      }
    } else {
      return {
        statusCode: EventStatus.MIXED_RESULT
      }
    }
  }

  async publish(listeners: string[], createdEvent: Event) {
    try {  
      const webhooksStatusesAndValues: AllSettledPromiseIndividualResult[] = await PubSubService.dispatchEventsConcurrently(listeners, JSON.parse(createdEvent.dataJSON));
      let numPublishedSuccessfully = 0, numPublishedUnsuccessfully = 0, totalNoOfSubscribers = listeners.length;
      webhooksStatusesAndValues.forEach((result: AllSettledPromiseIndividualResult) => {
        result.status === "fulfilled" ? numPublishedSuccessfully++ : numPublishedUnsuccessfully++
      });
      const numPendingPublish = totalNoOfSubscribers - (numPublishedSuccessfully + numPublishedUnsuccessfully);
      const { statusCode } = PubSubService.getStatus(totalNoOfSubscribers, numPublishedSuccessfully, numPublishedUnsuccessfully);
      const eventDetails = await this.eventRepo.updateEventStatus(createdEvent, {
            statusCode,
            numPendingPublish,
            numPublishedSuccessfully,
            numPublishedUnsuccessfully
          }
        );
      const eventStatusLogObj = new EventStatusDto({
        statusMessage: PubSubService.getEnumNameFromEnumValue(EventStatus, eventDetails.statusCode),
        eventDetails,
        webhooksStatusesAndValues
      });
      fs.writeFileSync(join(__dirname, process.env['EVENTS_LOG_DIR'], `${createdEvent.createDateTime.toISOString()}-${createdEvent.id}.json`), JSON.stringify(eventStatusLogObj, null, 2));
      console.log(`Done logging the status object of the event with id of '${createdEvent.id}'`);
    } catch (err) { throw err; }
  }
}
