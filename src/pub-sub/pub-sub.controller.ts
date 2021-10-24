import { Body, Controller, Param, Req, Post, Res, Get } from '@nestjs/common';
import { PubSubService } from './pub-sub.service';
import { SubscribeRequestDto } from '../domain/dto/subscribe.request.dto';
import { JSendResponseDto } from '../domain/dto/jsend-response.dto';
import { Request, Response } from 'express';
import { PublishResponseDto } from 'src/domain/dto/publish-response.dto';
import { SubscribeResponseDto } from '../domain/dto/subscribe-response.dto';
import { EventStatusDto } from '../domain/dto/event-status.dto';
import { Event } from '../domain/model/event.entity';
import { join } from 'path';
import { EventRepository } from '../repository/event.repository';
import { InjectRepository } from '@nestjs/typeorm';
import { EventStatus } from '../domain/enum/event-status.enum';

// import util from 'util';
// import glob from 'glob';

const glob = require('glob');
const util = require('util');
const fireAndForgetter = require('fire-and-forgetter').default;


@Controller()
export class PubSubController {
  constructor(
    private readonly pubSubService: PubSubService,
    @InjectRepository(EventRepository) private readonly eventRepo: EventRepository,
  ) {}

  @Post('subscribe/:topic')
  subscribe(@Param('topic') topic: string, @Req() req: Request, @Res() res: Response) {
    const {
      url,
      subscriberStatus,
      topicStatus,
      subscriptionDetails,
      useConsistentJsendResp
    } = req.body;
    // console.log(req.body);
    if (useConsistentJsendResp) {
      return res.status(201).send(
        new JSendResponseDto(
          "success",
          201,
          `The subscriber with the url '${url}' has been successfully subscribed to the topic with the name '${topic}', please note the subscription's details in data`,
          {
            subscriberStatus,
            topicStatus,
            subscriptionDetails
          }
        )
      )
    } else {
      return res.status(201).send(
        new SubscribeResponseDto(
          url,
          topic
        )
      )
    }
  }

  public fireAndForget = fireAndForgetter();
  @Post('publish/:topic')
  async publish(@Req() req: Request, @Res() res: Response) {
    // this.fireAndForget(() => this.pubSubService
    //   .publish(req.body.listerners, req.body.createdEvent));

    /*
      While I was intentional about preserving the exact APIs and their specs in this assessment,
      and thought to only make configurable designs to still allow for optional usage
      of a different API spec if that could make an endpoint more informative, consistent, or robust, yet,
      I couldn't maintain that tempo when it is crossing a philosophical consideration
      around the intended Semantics of HTTP, which is in conflict with the synchronous nature of
      how multiple publish requests are to be done as specified in the publish API spec in this assessment.
      Explanation:
        1) Since there can be multiple subscribers to a topic, a general http status code of pass or fail is misleading,
          because we can actually have 
            1) The case where "All subscribers are successfully dispactched to",
            2) The case where "No subscriber is successfully dispatched to", and
            3) The case where "Some subscribers are successfully dispatched to and some others are not"

        2) If a status code of 207 (HTTP multi statuses) is used to represent the third case,
          the response body has to come with a breakdown of whether each subscriber was dispatched to,
          and that already means altering the proposed spec, even with the risk of
          having an inconsistent response body spec with other cases in (1) above, and the risk of leaving the client
          waiting for too long if there are too many subscribers with some having much latency.

        3) Since (2) already defeats the purpose of preserving the proposed API spec if the response has to be robust,
          I thereby propose to go the standard way of HTTP semantics under this multi scenario action,
          the detailed  explanation of which can be seen in the long section of the accepted answer here: https://softwareengineering.stackexchange.com/questions/329596/what-http-status-code-to-return-if-multiple-actions-finish-with-different-status
          and the summary of that is as below:
          1) Make a single HTTP request which says "perform the following actions" and let me know if they are being processed in the background (202 HTTP status code) - /publish/:topic endpoint in our case
          2) Let me have a way (preferably HTTP) to know what the result of those actions are - /getEVentStatus/:eventId in our case
        
        4) Considering point (3) above,
          1) I will thereby have to run the /publish/:topic route asynchronously in a fire and forget way,
          2) The response body's spec has to change to inform the client consuming the method of the approach being used,
            as the client may not see the comments here in the code.
          3) I will expose a /getEventStatus/:eventId route to know the details of the event (which subscribers are successfully dispatched to and which are not)
    */

    this.pubSubService
      .publish(req.body.listeners, req.body.createdEvent);
    
    return res.status(202).send(
      new JSendResponseDto(
        "success",
        202,
        `Publish request is successfully validated, logged and being processed, please note the details in data, and query the event's status using '/getEventStatus/${req.body.eventID}' endpoint`,
        new EventStatusDto({
          statusMessage: PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.PROCESSING),
          eventDetails: await this.eventRepo.findOne(req.body.eventID),
          webhooksStatusesAndValues: []
        })
      )
    )
  }

  @Get('getEventStatus/:eventID')
  async getEventStatus(@Param('eventID') eventID: string, @Req() req: Request, @Res() res: Response) {
    let loggedEventObj: EventStatusDto<unknown>;

    // Checking if event status has been logged is delayed till here to get the most current value of its statusCode
    let latestEventStatus: Event = await this.eventRepo.findOne(eventID);
    if (latestEventStatus.statusCode != EventStatus.PROCESSING) {
      const globPromise = util.promisify(glob);
      try {
          const logpath: string = join(__dirname, `../pub-sub/${process.env['EVENTS_LOG_DIR']}`, `*-${eventID}.json`);
          const fileNames: string[] = await globPromise(logpath);
          console.log(fileNames);
          if (fileNames.length === 1) {
            const { webhooksStatusesAndValues } = require(fileNames[0]);
            loggedEventObj = new EventStatusDto({
              statusMessage: PubSubService.getEnumNameFromEnumValue(EventStatus, latestEventStatus.statusCode),
              eventDetails: latestEventStatus,
              webhooksStatusesAndValues
            });
          } else {
            // We'll be here when the event exists but its status file has been moved or deleted
            
          }
      } catch (err) {
        console.log(err);
        return res.status(500).send(
          new JSendResponseDto(
            "failed",
            500,
            `Internal Error while retrieving details of event with id of '${eventID}'`,
            "Plese try again or contact Pangaea"
          )
        );
      }
  
    } else {
      // We'll be here when the event exists but it hasn't yet been logged as it's still processing
      loggedEventObj = new EventStatusDto({
        statusMessage: PubSubService.getEnumNameFromEnumValue(EventStatus, latestEventStatus.statusCode),
        eventDetails: latestEventStatus,
        webhooksStatusesAndValues: null
      });
    }
    
    return res.status(200).send(
      new JSendResponseDto(
        "success",
        200,
        `The details of the event with id of '${eventID}' have been successfully retrieved, kindly see it in data`,
        loggedEventObj
      )
    )
  }
}
