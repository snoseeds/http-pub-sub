import { Event } from '../../domain/model/event.entity';
import { AllSettledPromiseIndividualResult } from '../types/all-settled-promise-individual-result';

export class EventStatusDto<T> {
  public statusMessage: string;
  public eventDetails: Event;
  public webhooksStatusesAndValues: AllSettledPromiseIndividualResult[];
  constructor(
    {
      statusMessage,
      eventDetails,
      webhooksStatusesAndValues
    }
  ) {
    this.statusMessage = statusMessage;
    this.eventDetails = eventDetails;
    this.webhooksStatusesAndValues = webhooksStatusesAndValues;
  }
}