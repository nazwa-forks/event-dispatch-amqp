import {
  EventsHandler,
  EventSubscriberInterface,
  OnMetadata,
  SubscriberMetadata,
} from "./types";

/**
 * Registry for all controllers and actions.
 */
export class MetadataRegistry {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  private _collectEventsHandlers: SubscriberMetadata[] = [];
  private _onMetadatas: OnMetadata[] = [];

  // -------------------------------------------------------------------------
  // Accessors
  // -------------------------------------------------------------------------

  /**
   * Gets all events handlers that registered here via annotations.
   */
  get collectEventsHandlers(): EventsHandler[] {
    const x = this._collectEventsHandlers.reduce(
      (handlers: EventsHandler[], subscriber: SubscriberMetadata) => {
        const instance: EventSubscriberInterface | undefined =
          this.instantiateClass(subscriber);

        if (!instance) {
          return handlers;
        }

        const mappingFoundInHandler = this._onMetadatas.filter(
          (metadata) => metadata.object.constructor === subscriber.object
        );

        mappingFoundInHandler.forEach((metadata) =>
          metadata.eventNames.map((eventName) => {
            handlers.push({
              subscriberName: subscriber.object.name,
              methodName: metadata.methodName,
              eventName,
              callback: (data: any) =>
                (<any>instance)[metadata.methodName](data),
            });
          })
        );

        return handlers;
      },
      []
    );

    return x;
  }

  getHandlersForEvent(eventName: string): EventsHandler[] {
    return this.collectEventsHandlers.filter((h) => h.eventName === eventName);
  }

  getHandlersForEventWithSubscriber(
    subscriberName: string,
    methodName: string,
    eventName: string
  ): EventsHandler[] {
    return this.collectEventsHandlers.filter(
      (h) =>
        h.subscriberName === subscriberName &&
        h.methodName === methodName &&
        h.eventName === eventName
    );
  }

  // -------------------------------------------------------------------------
  // Adder Methods
  // -------------------------------------------------------------------------

  addSubscriberMetadata(metadata: SubscriberMetadata) {
    this._collectEventsHandlers.push(metadata);
  }

  addOnMetadata(metadata: OnMetadata) {
    this._onMetadatas.push(metadata);
  }

  // -------------------------------------------------------------------------
  // Private Methods
  // -------------------------------------------------------------------------

  private instantiateClass(
    subscriber: SubscriberMetadata
  ): EventSubscriberInterface | undefined {
    if (!subscriber.instance) {
      const cls = subscriber.object;
      subscriber.instance = new cls();
    }

    return subscriber.instance;
  }
}

/**
 * Default action registry is used as singleton and can be used to storage all metadatas.
 */
export const defaultMetadataRegistry = new MetadataRegistry();
