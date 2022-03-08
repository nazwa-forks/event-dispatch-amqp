import { EventsHandler, OnMetadata, SubscriberMetadata } from "./types";
/**
 * Registry for all controllers and actions.
 */
export declare class MetadataRegistry {
    private _collectEventsHandlers;
    private _onMetadatas;
    /**
     * Gets all events handlers that registered here via annotations.
     */
    get collectEventsHandlers(): EventsHandler[];
    getHandlersForEvent(eventName: string): EventsHandler[];
    getHandlersForEventWithSubscriber(subscriberName: string, methodName: string, eventName: string): EventsHandler[];
    addSubscriberMetadata(metadata: SubscriberMetadata): void;
    addOnMetadata(metadata: OnMetadata): void;
    private instantiateClass;
}
/**
 * Default action registry is used as singleton and can be used to storage all metadatas.
 */
export declare const defaultMetadataRegistry: MetadataRegistry;
