"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.EventDispatcher = void 0;
const MetadataRegistry_1 = require("./MetadataRegistry");
class EventDispatcher {
    constructor() {
        // -------------------------------------------------------------------------
        // Properties
        // -------------------------------------------------------------------------
        this.handlers = {};
        this.setUpConsumer = (index) => {
            if (!this.queueManager) {
                return;
            }
            this.queueManager.subscribe(async (message) => {
                console.log(`Processing message through ${index}`);
                await this.executeSingleHandler(message);
            });
        };
    }
    // -------------------------------------------------------------------------
    // Public Methods
    // -------------------------------------------------------------------------
    setQueueManager(queueManager) {
        this.queueManager = queueManager;
    }
    setRemoteEventWhitelist(remoteEventWhitelist) {
        this.remoteEventWhitelist = remoteEventWhitelist;
    }
    isQueueEnabled() {
        return !!this.queueManager;
    }
    isEventWhitelistedForRemote(eventName) {
        if (!this.remoteEventWhitelist) {
            return true;
        }
        return this.remoteEventWhitelist.includes(eventName);
    }
    attach(attachTo, eventNameOrNames, callback) {
        let eventNames = [];
        if (eventNameOrNames instanceof Array) {
            eventNames = eventNameOrNames;
        }
        else {
            eventNames = [eventNameOrNames];
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
    on(eventNameOrNames, callback) {
        this.attach(undefined, eventNameOrNames, callback);
    }
    dispatch(eventNameOrNames, data) {
        let eventNames = [];
        if (eventNameOrNames instanceof Array) {
            eventNames = eventNameOrNames;
        }
        else if (typeof eventNameOrNames === "string") {
            eventNames = [eventNameOrNames];
        }
        const nestedPromises = eventNames.map((eventName) => {
            // This handles all listeners attached directly using `on` or `attach`
            if (this.handlers[eventName])
                this.handlers[eventName].forEach((handler) => handler.callback(data));
            // This handles everything added using decorators
            return this.dispatchSingleEvent(eventName, data);
        });
        // It's up to the caller to decide what to do with these.
        // Maybe we'll provide a convenience method at some point to help figure out specifically which handler failed to execute, but that's for some other day
        return new Promise((resolve) => {
            Promise.allSettled(nestedPromises.flat());
            resolve();
        });
    }
    async dispatchSingleEvent(eventName, data) {
        const handlers = MetadataRegistry_1.defaultMetadataRegistry.getHandlersForEvent(eventName);
        if (this.isQueueEnabled() && this.isEventWhitelistedForRemote(eventName)) {
            return this.dispatchSingleEventRemotely(handlers, data);
        }
        this.dispatchSingleEventLocally(handlers, data);
    }
    dispatchSingleEventLocally(selectedHandlers, data) {
        return selectedHandlers.map((handler) => {
            handler.callback(data);
        });
    }
    dispatchSingleEventRemotely(selectedHandlers, data) {
        if (!this.queueManager) {
            throw new Error(`Queue Manager has not been set up`);
        }
        const routingKeys = selectedHandlers.map((handler) => {
            return `${handler.eventName}.${handler.subscriberName}.${handler.methodName}`;
        });
        return this.queueManager.publishEvent(routingKeys, data);
    }
    async executeSingleHandler(message) {
        const [eventName, subscriberName, methodName] = message.routingKey.split(".");
        const handlers = MetadataRegistry_1.defaultMetadataRegistry.getHandlersForEventWithSubscriber(subscriberName, methodName, eventName);
        await Promise.all(handlers.map((handler) => {
            return handler.callback(message.content);
        }));
    }
    activateQueueSubscriber(consumerCount) {
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
exports.EventDispatcher = EventDispatcher;
