export interface SubscriberMetadata {
    object: any;
    instance?: EventSubscriberInterface;
}
export interface EventMessage {
    routingKey: string;
    content?: unknown;
}
export declare type ConsumerHandler = (body: EventMessage) => Promise<void>;
export interface OnMetadata {
    object: Object;
    methodName: string;
    eventNames: string[];
}
export declare type EventSubscriberInterface = unknown;
export interface EventsHandler {
    subscriberName: string;
    methodName: string;
    eventName: string;
    callback: (data: any) => Promise<void>;
}