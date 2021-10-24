import { SubscriberPublishResult } from "./subscriber-publish-result";

export interface AllSettledPromiseIndividualResult {
  status: string;
  value?: SubscriberPublishResult
  reason?: SubscriberPublishResult;
}