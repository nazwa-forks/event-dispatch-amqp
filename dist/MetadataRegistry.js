"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.defaultMetadataRegistry = exports.MetadataRegistry = void 0;
/**
 * Registry for all controllers and actions.
 */
class MetadataRegistry {
    constructor() {
        // -------------------------------------------------------------------------
        // Properties
        // -------------------------------------------------------------------------
        this._collectEventsHandlers = [];
        this._onMetadatas = [];
    }
    // -------------------------------------------------------------------------
    // Accessors
    // -------------------------------------------------------------------------
    /**
     * Gets all events handlers that registered here via annotations.
     */
    get collectEventsHandlers() {
        const x = this._collectEventsHandlers.reduce((handlers, subscriber) => {
            const instance = this.instantiateClass(subscriber);
            if (!instance) {
                return handlers;
            }
            const mappingFoundInHandler = this._onMetadatas.filter((metadata) => metadata.object.constructor === subscriber.object);
            mappingFoundInHandler.forEach((metadata) => metadata.eventNames.map((eventName) => {
                handlers.push({
                    subscriberName: subscriber.object.name,
                    methodName: metadata.methodName,
                    eventName,
                    callback: (data) => instance[metadata.methodName](data),
                });
            }));
            return handlers;
        }, []);
        return x;
    }
    getHandlersForEvent(eventName) {
        return this.collectEventsHandlers.filter((h) => h.eventName === eventName);
    }
    getHandlersForEventWithSubscriber(subscriberName, methodName, eventName) {
        return this.collectEventsHandlers.filter((h) => h.subscriberName === subscriberName &&
            h.methodName === methodName &&
            h.eventName === eventName);
    }
    // -------------------------------------------------------------------------
    // Adder Methods
    // -------------------------------------------------------------------------
    addSubscriberMetadata(metadata) {
        this._collectEventsHandlers.push(metadata);
    }
    addOnMetadata(metadata) {
        this._onMetadatas.push(metadata);
    }
    // -------------------------------------------------------------------------
    // Private Methods
    // -------------------------------------------------------------------------
    instantiateClass(subscriber) {
        if (!subscriber.instance) {
            const cls = subscriber.object;
            subscriber.instance = new cls();
        }
        return subscriber.instance;
    }
}
exports.MetadataRegistry = MetadataRegistry;
/**
 * Default action registry is used as singleton and can be used to storage all metadatas.
 */
exports.defaultMetadataRegistry = new MetadataRegistry();
