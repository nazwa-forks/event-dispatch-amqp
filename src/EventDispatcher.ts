import { defaultMetadataRegistry } from "./MetadataRegistry";
import { QueueManager } from "./QueueManager";
import { EventMessage, EventsHandler } from "./types";

export interface EventDispatcherOptions {
  queueManager?: QueueManager;
  remoteEventWhitelist?: string[];
}

export class EventDispatcher {
  // -------------------------------------------------------------------------
  // Properties
  // -------------------------------------------------------------------------

  private queueManager?: QueueManager;

  private remoteEventWhitelist?: string[];

  private handlers: {
    [eventName: string]: { attachedTo: any; callback: (data: any) => void }[];
  } = {};

  // -------------------------------------------------------------------------
  // Public Methods
  // -------------------------------------------------------------------------

  public setQueueManager(queueManager: QueueManager) {
    this.queueManager = queueManager;
  }

  public setRemoteEventWhitelist(remoteEventWhitelist: string[]) {
    this.remoteEventWhitelist = remoteEventWhitelist;
  }

  public isQueueEnabled(): boolean {
    return !!this.queueManager;
  }

  public isEventWhitelistedForRemote(eventName: string): boolean {
    if (!this.remoteEventWhitelist) {
      return true;
    }

    return this.remoteEventWhitelist.includes(eventName);
  }

  attach(attachTo: any, eventName: string, callback: (data: any) => void): void;
  attach(
    attachTo: any,
    eventNames: string[],
    callback: (data: any) => void
  ): void;
  attach(
    attachTo: any,
    eventNameOrNames: string | string[],
    callback: (data: any) => void
  ) {
    let eventNames: string[] = [];
    if (eventNameOrNames instanceof Array) {
      eventNames = <string[]>eventNameOrNames;
    } else {
      eventNames = [<string>eventNameOrNames];
    }

    eventNames.forEach((eventName) => {
      if (!this.handlers[eventName]) {
        this.handlers[eventName] = [];
      }

      this.handlers[eventName].push({
        attachedTo: attachTo,
        callback: callback,
      });
    });
  }

  on(eventName: string, callback: (data: any) => void): void;
  on(eventNames: string[], callback: (data: any) => void): void;
  on(eventNameOrNames: string | string[], callback: (data: any) => void) {
    this.attach(undefined, <any>eventNameOrNames, callback);
  }

  dispatch<T>(eventName: string, data?: T): Promise<void>;
  dispatch<T>(eventNames: string[], data?: T): Promise<void>;
  dispatch<T>(eventNameOrNames: string | string[], data?: T): Promise<void> {
    let eventNames: string[] = [];
    if (eventNameOrNames instanceof Array) {
      eventNames = <string[]>eventNameOrNames;
    } else if (typeof eventNameOrNames === "string") {
      eventNames = [eventNameOrNames];
    }

    const nestedPromises = eventNames.map((eventName) => {
      // This handles all listeners attached directly using `on` or `attach`
      if (this.handlers[eventName])
        this.handlers[eventName].forEach((handler) => handler.callback(data));

      // This handles everything added using decorators
      return this.dispatchSingleEvent<T>(eventName, data);
    });

    // It's up to the caller to decide what to do with these.
    // Maybe we'll provide a convenience method at some point to help figure out specifically which handler failed to execute, but that's for some other day
    return new Promise((resolve) => {
      Promise.allSettled(nestedPromises.flat());

      resolve();
    });
  }

  async dispatchSingleEvent<T>(eventName: string, data?: T): Promise<void> {
    const handlers = defaultMetadataRegistry.getHandlersForEvent(eventName);

    if (this.isQueueEnabled() && this.isEventWhitelistedForRemote(eventName)) {
      return this.dispatchSingleEventRemotely(handlers, data);
    }

    this.dispatchSingleEventLocally(handlers, data);
  }

  private dispatchSingleEventLocally<T>(
    selectedHandlers: EventsHandler[],
    data?: T
  ): void[] {
    return selectedHandlers.map((handler) => {
      handler.callback(data);
    });
  }

  private dispatchSingleEventRemotely<T>(
    selectedHandlers: EventsHandler[],
    data?: T
  ): Promise<void> {
    if (!this.queueManager) {
      throw new Error(`Queue Manager has not been set up`);
    }

    const routingKeys = selectedHandlers.map((handler): string => {
      return `${handler.eventName}.${handler.subscriberName}.${handler.methodName}`;
    });

    return this.queueManager.publishEvent(routingKeys, data);
  }

  async executeSingleHandler(message: EventMessage): Promise<void> {
    const [eventName, subscriberName, methodName] =
      message.routingKey.split(".");

    const handlers = defaultMetadataRegistry.getHandlersForEventWithSubscriber(
      subscriberName,
      methodName,
      eventName
    );

    await Promise.all(
      handlers.map((handler) => {
        return handler.callback(message.content);
      })
    );
  }

  setUpConsumer = (index: number) => {
    if (!this.queueManager) {
      return;
    }

    this.queueManager.subscribe(
      async (message: EventMessage): Promise<void> => {
        console.log(`Processing message through ${index}`);
        await this.executeSingleHandler(message);
      }
    );
  };

  public activateQueueSubscriber(consumerCount: number) {
    if (!this.queueManager) {
      return;
    }

    if (!consumerCount) {
      return;
    }

    if (consumerCount < 0) {
      throw new Error(`Consumers count must be a number of zero or more`);
    }

    for (let i = 0; i < consumerCount; i += 1) {
      this.setUpConsumer(i);
    }
  }
}
