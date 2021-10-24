import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';
import { Connection, getConnection } from 'typeorm';
import { PubSubModule } from '../src/pub-sub/pub-sub.module';
import { TypeOrmModule } from '@nestjs/typeorm';
import { AppController } from '../src/app.controller';
import { AppService } from '../src/app.service';
import { configService } from '../src/config/config.service';
import { PubSubService } from '../src/pub-sub/pub-sub.service';
import { EventRepository } from '../src/repository/event.repository';
import { Topic } from '../src/domain/model/topic.entity';
import { Event } from '../src/domain/model/event.entity';
import { EventStatus } from '../src/domain/enum/event-status.enum';
import { AllSettledPromiseIndividualResult } from '../src/domain/types/all-settled-promise-individual-result';
import { SubscriberRepository } from '../src/repository/subscriber.repository';
import { SubscriptionRepository } from '../src/repository/subscription.repository';
import { TopicRepository } from '../src/repository/topic.repository';
import { Subscriber, Subscription } from 'rxjs';
import { join } from 'path';

const glob = require('glob');
const util = require('util');
const nock = require('nock')

describe('PubSubController (e2e)', () => {
  let app: INestApplication;
  let connection: Connection;

  beforeAll(async () => {
    // Condition to make sure process.env['EVENTS_LOG_DIR'] isn't pointing to dev or prod folder
      // to prevent mistakenly deleting the event status log files there
    if (process.env.MODE == 'TEST') {
      const logPath = `../src/pub-sub/${process.env['EVENTS_LOG_DIR']}`;
      const deleleEventLogFilesCommand = `rm ${join(__dirname, logPath, '*')}`;
      try {
        const exec = util.promisify(require('child_process').exec);
        await exec(deleleEventLogFilesCommand);
      } catch (err) {
        console.log(err);
      }
    }
    // Making sure to unregister nock from listening to the urls registered to it
    nock.cleanAll();
  });

  afterAll(() => {
    // Making sure to unregister nock from listening to the urls registered to it
    nock.cleanAll();
  })

  beforeEach(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
      // imports: [
      //   AppModule,
      //   TypeOrmModule.forFeature([EventRepository, SubscriptionRepository, SubscriberRepository, TopicRepository]),
      //   TypeOrmModule.forRoot(configService.getTypeOrmConfig()),
      //   PubSubModule
      // ],
      // controllers: [AppController],
      // providers: [AppService, PubSubService],
      // exports: [PubSubService]
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(new ValidationPipe());

    await app.init();
    connection = getConnection();
  });

  afterEach(async () => {
    await connection.close();
    await app.close();
  });

  const topicForSuccessTest = 'capability';
  const successfulSubscription = {
    subscriptionDetails: null
  }

  describe('/subscribe/:topic (POST) (e2e)', () => {
    it('Failure: when url reqBody is an invalid url', async () => {
      const reqBody =  {
        url: "playground"
      }
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/capability`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "target": {
                      "url": "playground",
                      "useConsistentJsendResp": true,
                  },
                  "value": "playground",
                  "property": "url",
                  "children": [],
                  "constraints": {
                      "isUrl": "url must be an URL address"
                  }
              }
          ]
        }
      ) 
    });

    it('Failure: request body is missing required field - url', async () => {
      const reqBody =  {};
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/capability`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Bad request, details are in data",
          "data": [
              {
                  "target": {
                    "useConsistentJsendResp": true,
                  },
                  "property": "url",
                  "children": [],
                  "constraints": {
                      "isUrl": "url must be an URL address",
                      "isNotEmpty": "url should not be empty",
                      "isString": "url must be a string"
                  }
              }
          ]
        }
      ) 
    });

    const urlForSuccessTest = "http://localhost:8000/event";
    //first successful subscription
    it(`Success: it should inform that it has created a new subscriber and a new topic
        for valid and new topic param and new url reqBody respectively,
        while creating a new subscription that pairs them together`, async () => {
      const topicName = topicForSuccessTest;
      const reqBody =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(reqBody)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Newly created subscriber");
      expect(body.data.topicStatus).toEqual("Newly created topic");
      expect(body.message).toEqual(`The subscriber with the url '${reqBody.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      successfulSubscription.subscriptionDetails = subscriptionDetails
      const { subscriber, topic } = subscriptionDetails;

      const persistedSubscriber = await connection.getCustomRepository(SubscriberRepository).findByWebHook(reqBody.url);
      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscriber.id).toEqual(subscriber.id);
      expect(persistedTopic.id).toEqual(topic.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    it('Failure: duplicate subscription by attempting to resubcribe a subscriber to a topic', async () => {
      // details of the successful subscription test just above will be used
      const topicName = topicForSuccessTest;
      const reqBody =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(reqBody)
        .expect(400)
      
      expect(body.message).toEqual("This subscriber has previously subscribed to this topic, please see subscription's details in data");
      expect(body.data.subscriptionDetails.id).toEqual(successfulSubscription.subscriptionDetails.id);

    });

    it(`Success: showing how to get response in the handover api spec`, async () => {
      const topicName = "Asynchronous Programming";
      const reqBody =  {
        url: "http://localhost:8000/nodejs",
        useConsistentJsendResp: false
      };

      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(reqBody)
        .expect(201)

      expect(body.url).toEqual("http://localhost:8000/nodejs");
      expect(body.topic).toEqual(topicName);

      const persistedSubscriber = await connection.getCustomRepository(SubscriberRepository).findByWebHook(reqBody.url);
      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      
      expect(persistedSubscriber.url).toEqual(reqBody.url);
      expect(persistedTopic.name).toEqual(topicName);
    });

    const urlToUsedForThisAndLastTest = 'http://localhost:8000/chatroom';
    const secondSuccessfulSubToUse = {
      subscriptionDetails: null
    }
    it(`Success: new subscriber, existing topic, new subscription`, async () => {
      // details of the successful subscription test's topic two steps will be used
      const topic = topicForSuccessTest;
      const reqBody =  {
        url: urlToUsedForThisAndLastTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topic}`)
        .send(reqBody)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Newly created subscriber");
      expect(body.data.topicStatus).toEqual("Existing topic");
      expect(body.message).toEqual(`The subscriber with the url '${reqBody.url}' has been successfully subscribed to the topic with the name '${topic}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      secondSuccessfulSubToUse.subscriptionDetails = subscriptionDetails;
      const { subscriber } = subscriptionDetails;

      const persistedSubscriber = await connection.getCustomRepository(SubscriberRepository).findByWebHook(reqBody.url);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscriber.id).toEqual(subscriber.id);
      // using the first successful subscription
      expect(body.data.subscriptionDetails.topic.id).toEqual(successfulSubscription.subscriptionDetails.topic.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    const topicToUsedForTheNextTwoTests = 'software-development';
    const thirdSuccessfulSubToUse = {
      subscriptionDetails: null
    }
    it(`Success: existing subscriber, new topic, new subscription`, async () => {
      // details of the successful subscription test's url reqBody in three test above will be used
      const topicName = topicToUsedForTheNextTwoTests;
      const reqBody =  {
        url: urlForSuccessTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topicName}`)
        .send(reqBody)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Existing subscriber");
      expect(body.data.topicStatus).toEqual("Newly created topic");
      expect(body.message).toEqual(`The subscriber with the url '${reqBody.url}' has been successfully subscribed to the topic with the name '${topicName}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;
      thirdSuccessfulSubToUse.subscriptionDetails = subscriptionDetails;
      const { topic } = subscriptionDetails;

      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedTopic.id).toEqual(topic.id);
      // using the first successful subscription
      expect(body.data.subscriptionDetails.subscriber.id).toEqual(successfulSubscription.subscriptionDetails.subscriber.id);
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
    });

    it(`Success: existing subscriber, existing topic, new subscription`, async () => {
      // We will use existing subsriber (url reqBody) created from the successful subscription tagged secondSuccessfulSubToUse
      // We will use existing topic created from the new subscription just above
      const topic = topicToUsedForTheNextTwoTests;
      const reqBody =  {
        url: urlToUsedForThisAndLastTest
      };
      const { body } = await request(app.getHttpServer())
        .post(`/subscribe/${topic}`)
        .send(reqBody)
        .expect(201)
      
      expect(body.data.subscriberStatus).toEqual("Existing subscriber");
      expect(body.data.topicStatus).toEqual("Existing topic");
      expect(body.message).toEqual(`The subscriber with the url '${reqBody.url}' has been successfully subscribed to the topic with the name '${topic}', please note the subscription's details in data`);
      
      const { subscriptionDetails } = body.data;

      const persistedSubscription = await connection.getCustomRepository(SubscriptionRepository).findByCompoundKey(subscriptionDetails.subscriberAndTopic);
      
      expect(persistedSubscription.id).toEqual(subscriptionDetails.id);
      // using the first successful subscription and the successful subscription just above
      expect(body.data.subscriptionDetails.subscriber.id).toEqual(secondSuccessfulSubToUse.subscriptionDetails.subscriber.id);
      expect(body.data.subscriptionDetails.topic.id).toEqual(thirdSuccessfulSubToUse.subscriptionDetails.topic.id);
    });
  })

  let eventIDForNoSuccessfulDelivery: string;
  let topicNameForMockCalls: string;
  let subscribersForMockCall: string[];
  describe('/publish/:topic (POST) (e2e)', () => {
    it('Failure: request body is empty', async () => {
      const reqBody =  {};
      const { body } = await request(app.getHttpServer())
        .post(`/publish/capability`)
        .send(reqBody)
        .expect(400)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 400,
          "message": "Event's body cannot be empty",
          "data": null
        }
      ) 
    });

    it(`success: published to new topic with no subscribers,
      although that only has the effect of persisting a new topic and an event that's not dispatched anywhere presently,
      and can be specified for the published data to be in a pending state till there are subscribers if need be later`, async () => {
      
      const reqBody =  {
        morale: "Be the hero you would wanna be"
      }

      const newTopicName = "machines";
      const { body } = await request(app.getHttpServer())
        .post(`/publish/${newTopicName}`)
        .send(reqBody)
        .expect(202)
      
        
      const { eventDetails, statusMessage } = body.data;
      const { id: eventID, totalNoOfSubscribers } = eventDetails;
      
      const persistedTopic = await connection.getCustomRepository(TopicRepository).findByName(newTopicName);
      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
      
      expect(body.message).toEqual(`Publish request is successfully validated, logged and being processed, please note the details in data, and query the event's status using '/getEventStatus/${eventID}' endpoint`);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.PROCESSING));
      expect(totalNoOfSubscribers).toEqual(0);
      expect(persistedEvent.topic.name).toEqual(newTopicName); // what we saved tallies with what we sent
      expect(persistedEvent.dataJSON).toEqual(JSON.stringify(reqBody)); // what we saved tallies with what we sent
      expect(persistedEvent.id).toEqual(eventDetails.id); // what we saved tallies with what is returned to us
      expect(persistedEvent.topic.id).toEqual(persistedTopic.id); // what we saved has a correct relationship with another data
    });

    const subscriberDetailsForNextTwoCalls = {
      subscriptionDetails: []
    };
    // For /getEventStatus/:eventID to use the eventID just under here as the case where none of the subscribers is successfully published to:
      // no sample test server having the urls subscribed to the topic to be used here will be spun up while publishing to the topic
    it(`Success: publish to existing topic name and create a new event record
      - which is a record of a message being published to a topic`, async () => {
      const topicName = 'capacity';
      topicNameForMockCalls = topicName;
      const reqBody = {
        inspiration: "Audacity is a strength"
      };
      const subscribers = [
        "http://localhost:8000",
        "http://localhost:8001",
        "http://localhost:8002",
        "http://localhost:8003"
      ];

      subscribersForMockCall = [ ...subscribers ];
      // Creating subscriptions to the topicName
      for (let subscriber of subscribers) {
        const { body } = await request(app.getHttpServer())
          .post(`/subscribe/${topicName}`)
          .send({
            url: subscriber
          })

          subscriberDetailsForNextTwoCalls.subscriptionDetails.push(body.data.subscriptionDetails);
      }

      // Publishing to the existing topic having all the subscribers above
      const { body } = await request(app.getHttpServer())
        .post(`/publish/${topicName}`)
        .send(reqBody)
        .expect(202)
      
      const { eventDetails, statusMessage } = body.data;
      const { id: eventID, statusCode, totalNoOfSubscribers, numPendingPublish, numPublishedSuccessfully, numPublishedUnsuccessfully } = eventDetails;
      eventIDForNoSuccessfulDelivery = eventID;

      const persistedTopicPublishedTo = await connection.getCustomRepository(TopicRepository).findByName(topicName);
      const persistedSubscriptionsToTopic = await connection.getCustomRepository(SubscriptionRepository).findByTopicID(persistedTopicPublishedTo.id);
      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
      
      console.log(eventDetails);
      expect(body.message).toEqual(`Publish request is successfully validated, logged and being processed, please note the details in data, and query the event's status using '/getEventStatus/${eventID}' endpoint`);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.PROCESSING));
      expect(statusCode).toEqual(EventStatus.PROCESSING);
      expect(totalNoOfSubscribers).toEqual(persistedSubscriptionsToTopic.length);
      expect(numPendingPublish).toEqual(persistedSubscriptionsToTopic.length);
      expect(numPublishedSuccessfully).toEqual(null);
      expect(numPublishedUnsuccessfully).toEqual(null);
      expect(persistedEvent.topic.name).toEqual(topicName); // what we saved tallies with what we sent
      expect(persistedEvent.dataJSON).toEqual(JSON.stringify(reqBody)); // what we saved tallies with what we sent
      expect(persistedEvent.id).toEqual(eventDetails.id); // what we saved tallies with what is returned to us
      expect(persistedEvent.topic.id).toEqual(persistedTopicPublishedTo.id); // what we saved has a correct relationship with another data

      // Test to confirm that whatever receipts or rejections from the subscribers are logged correctly by our publish operation
      const recipientsUrls = persistedSubscriptionsToTopic.map(subscription => {
          return subscription.subscriber.url
      });

      const receiptsFromSendingSimilarPosts: AllSettledPromiseIndividualResult[] = await PubSubService.dispatchEventsConcurrently(recipientsUrls, reqBody);
      
      let loggedEventObj = await (async function accessLoggedEventStatusObj() {
        const latestPersistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
        if (latestPersistedEvent.statusCode != EventStatus.PROCESSING) {
          try {
            const globPromise = util.promisify(glob);
            const logpath: string = join(__dirname, `../src/pub-sub/${process.env['EVENTS_LOG_DIR']}`, `*-${eventID}.json`);
            const fileNames: string[] = await globPromise(logpath);
            return require(fileNames[0]);
          } catch(err) {
            console.log(err);
          }
        } else {
          return accessLoggedEventStatusObj()
        }
      })();
      const { webhooksStatusesAndValues } = loggedEventObj;
      expect(webhooksStatusesAndValues).toEqual(receiptsFromSendingSimilarPosts);
    
    });
  })

  describe('/getEventStatus/:eventID (GET) (e2e)', () => {
    it('Failure: inexisting eventID', async () => {
      const eventID = 'b9fcf075-2694-45cc-8dda-a8308b3cf53e';
      const { body } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(404)
      
      expect(body).toEqual(
        {
          "status": "failed",
          "statusCode": 404,
          "message": "The event with id 'b9fcf075-2694-45cc-8dda-a8308b3cf53e' does not exist on this platform",
          "data": null
        }
      ) 
    });

    const topicNameForNextTwoCases = "engineers";
    let eventIDForNextTwoCases: string; /*
      1) the case of the event still being processed 
      2) the case of event whose topic has no subscribers
    */
    let originalStateOfEventBeforeSetToProcessing: Event;
    it(`success: event exists but it's still being processed`, async () => {
      const reqBody =  {
        morale: "Be the hero you would wanna be"
      }

      /*** Start of Publish to get the eventID to use for getEventStatus****/
      
      const { body: publishBody } = await request(app.getHttpServer())
        .post(`/publish/${topicNameForNextTwoCases}`)
        .send(reqBody)
      
      const { id: eventID } = publishBody.data.eventDetails;
      eventIDForNextTwoCases = eventID;

      // To simulate the event as processing
      const persistedEvent: Event = await (async function makeEventToAppearItsProcessing() {
        // The trick is to allow status to change from processing, and then set it to processing along with restoring other defaults
        const latestPersistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
        if (latestPersistedEvent.statusCode != EventStatus.PROCESSING) {
          originalStateOfEventBeforeSetToProcessing = { ...latestPersistedEvent };
          try {
            return await connection.getCustomRepository(EventRepository)
              .updateEventStatus(
                latestPersistedEvent,
                {
                  statusCode: EventStatus.PROCESSING,
                  numPendingPublish: latestPersistedEvent.numPendingPublish,
                  numPublishedSuccessfully: null,
                  numPublishedUnsuccessfully: null
                }
              )
          } catch(err) {
            console.log(err);
          }
        } else {
          return makeEventToAppearItsProcessing()
        }
      })()
      /**** End of Publish to get the eventID to use for getEventStatus */

      const { body: eventStatusBody } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(200)

      const { statusMessage, eventDetails, webhooksStatusesAndValues } = eventStatusBody.data;
      
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.PROCESSING));
      expect(eventDetails.statusCode).toEqual(EventStatus.PROCESSING);
      expect(webhooksStatusesAndValues).toEqual(null);

      expect(eventDetails.id).toEqual(eventID); // what is returned to us is what we requested for   
      expect(eventDetails.id).toEqual(persistedEvent.id); // what is returned to us is from what is persisted
    });
    
    it(`success: event's topic has no subscribers`, async () => {
      const eventID = eventIDForNextTwoCases;
      // Update the event above to what it was before being set to processing
      const eventAlteredToProcessing = await connection.getCustomRepository(EventRepository).findOne(eventID);
      let persistedEvent: Event = await connection.getCustomRepository(EventRepository)
        .updateEventStatus(
          eventAlteredToProcessing,
          {
            statusCode: originalStateOfEventBeforeSetToProcessing.statusCode,
            numPendingPublish: originalStateOfEventBeforeSetToProcessing.numPendingPublish,
            numPublishedSuccessfully: originalStateOfEventBeforeSetToProcessing.numPublishedSuccessfully,
            numPublishedUnsuccessfully: originalStateOfEventBeforeSetToProcessing.numPublishedUnsuccessfully
          }
        )

      const { body: eventStatusBody } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(200)

      const {
        statusMessage,
        eventDetails,
        webhooksStatusesAndValues
      } = eventStatusBody.data;

      expect(eventDetails.statusCode).toEqual(EventStatus.ALL_SUCCESSFUL);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.ALL_SUCCESSFUL));
      expect(webhooksStatusesAndValues).toEqual([]);
      expect(eventDetails.id).toEqual(eventID); // what is returned to us is what we requested for   
      expect(eventDetails.id).toEqual(persistedEvent.id); // what is returned to us is from what is persisted
    });

    it(`success: failed to deliver to all event topic's subscribers`, async () => {
      const eventID = eventIDForNoSuccessfulDelivery;

      const { body: eventStatusBody } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(200)

      const {
        statusMessage,
        eventDetails,
        webhooksStatusesAndValues
      } = eventStatusBody.data;

      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);

      // Getting the loggedEventObject
      let loggedEventObj = await (async function accessLoggedEventStatusObj() {
        const latestPersistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
        if (latestPersistedEvent.statusCode != EventStatus.PROCESSING) {
          try {
            const globPromise = util.promisify(glob);
            const logpath: string = join(__dirname, `../src/pub-sub/${process.env['EVENTS_LOG_DIR']}`, `*-${eventID}.json`);
            const fileNames: string[] = await globPromise(logpath);
            return require(fileNames[0]);
          } catch(err) {
            console.log(err);
          }
        } else {
          return accessLoggedEventStatusObj()
        }
      })();
      const { webhooksStatusesAndValues: loggedEvent } = loggedEventObj;

      expect(eventDetails.statusCode).toEqual(EventStatus.ALL_NOT_AVAILABLE);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.ALL_NOT_AVAILABLE));
      expect(webhooksStatusesAndValues).toEqual(loggedEvent);
      expect(eventDetails.id).toEqual(eventID); // what is returned to us is what we requested for   
      expect(eventDetails.id).toEqual(persistedEvent.id); // what is returned to us is from what is persisted
    });

    it(`success: successfully delivered to all event topic's subscribers`, async () => {
      
      // Intercept these webhooks before publishing to the topic they subscribe to
      subscribersForMockCall.forEach((subscriber, i) => {
        nock(`${subscriber}`)
          .post('/')
          // This is in order to make one of these subscribers (the first one specifically)
              // not to be intercepted more than once, in order to prepare for the mixed success and failure test case below
          .times(i + 1)
          .reply(200, `Thanks for posting to this channel: '${subscriber}'`)
      });

      /*** Start of Publish to get the eventID to use for getEventStatus****/
      const reqBody = {
        motivation: 'effective empathy' 
      };

      const { body: publishBody } = await request(app.getHttpServer())
        .post(`/publish/${topicNameForMockCalls}`)
        .send(reqBody)
    
      const { id: eventID } = publishBody.data.eventDetails;
      /**** End of Publish to get the eventID to use for getEventStatus */
      
      // Getting the loggedEventObject
      // This delay is also necessary to ensure that the details from getEventStatus
        // will get an event that has finished processing
      let loggedEventObj = await (async function accessLoggedEventStatusObj() {
        const latestPersistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
        if (latestPersistedEvent.statusCode != EventStatus.PROCESSING) {
          try {
            const globPromise = util.promisify(glob);
            const logpath: string = join(__dirname, `../src/pub-sub/${process.env['EVENTS_LOG_DIR']}`, `*-${eventID}.json`);
            const fileNames: string[] = await globPromise(logpath);
            return require(fileNames[0]);
          } catch(err) {
            console.log(err);
          }
        } else {
          return accessLoggedEventStatusObj()
        }
      })();
      
      const { body: eventStatusBody } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(200)

      const {
        statusMessage,
        eventDetails,
        webhooksStatusesAndValues
      } = eventStatusBody.data;

      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);

      const { webhooksStatusesAndValues: loggedEvent } = loggedEventObj;

      expect(eventDetails.statusCode).toEqual(EventStatus.ALL_SUCCESSFUL);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.ALL_SUCCESSFUL));
      expect(webhooksStatusesAndValues).toEqual(loggedEvent);
      expect(eventDetails.id).toEqual(eventID); // what is returned to us is what we requested for   
      expect(eventDetails.id).toEqual(persistedEvent.id); // what is returned to us is from what is persisted
    });

    it(`success: partial successful and failure delivery to event topic's subscribers`, async () => {
      /*** Start of Publish to get the eventID to use for getEventStatus****/
      const reqBody = {
        zeal: 'Audacity is a strength' 
      };

      // One of the subscribers to this topicNameForMockCalls will not be available as explained
        // in the Nock interception section of the test case just above,
        // That's in order to make this case represent where some subscribers to the
        // published topic are successfully delivered to while others are not
      const { body: publishBody } = await request(app.getHttpServer())
        .post(`/publish/${topicNameForMockCalls}`)
        .send(reqBody)
    
      const { id: eventID } = publishBody.data.eventDetails;
      /**** End of Publish to get the eventID to use for getEventStatus */
      
      // Getting the loggedEventObject
      // This delay is also necessary to ensure that the details from getEventStatus
        // will get an event that has finished processing
      let loggedEventObj = await (async function accessLoggedEventStatusObj() {
        const latestPersistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);
        if (latestPersistedEvent.statusCode != EventStatus.PROCESSING) {
          try {
            const globPromise = util.promisify(glob);
            const logpath: string = join(__dirname, `../src/pub-sub/${process.env['EVENTS_LOG_DIR']}`, `*-${eventID}.json`);
            const fileNames: string[] = await globPromise(logpath);
            return require(fileNames[0]);
          } catch(err) {
            console.log(err);
          }
        } else {
          return accessLoggedEventStatusObj()
        }
      })();

      const { body: eventStatusBody } = await request(app.getHttpServer())
        .get(`/getEventStatus/${eventID}`)
        .expect(200)

      const {
        statusMessage,
        eventDetails,
        webhooksStatusesAndValues
      } = eventStatusBody.data;

      const persistedEvent = await connection.getCustomRepository(EventRepository).findOne(eventID);

      const { webhooksStatusesAndValues: loggedEvent } = loggedEventObj;

      expect(eventDetails.statusCode).toEqual(EventStatus.MIXED_RESULT);
      expect(statusMessage).toEqual(PubSubService.getEnumNameFromEnumValue(EventStatus, EventStatus.MIXED_RESULT));
      expect(webhooksStatusesAndValues).toEqual(loggedEvent);
      expect(eventDetails.id).toEqual(eventID); // what is returned to us is what we requested for   
      expect(eventDetails.id).toEqual(persistedEvent.id); // what is returned to us is from what is persisted

      // Making sure to unregister nock from listening to the urls registered to it
      nock.cleanAll();
    });   
  })  
});