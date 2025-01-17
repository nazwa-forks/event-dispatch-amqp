"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.On = exports.EventSubscriber = void 0;
const MetadataRegistry_1 = require("./MetadataRegistry");
function EventSubscriber() {
    return function (object) {
        MetadataRegistry_1.defaultMetadataRegistry.addSubscriberMetadata({
            object,
            instance: undefined,
        });
    };
}
exports.EventSubscriber = EventSubscriber;
function On(eventNameOrNames) {
    return function (object, methodName) {
        let eventNames = [];
        if (eventNameOrNames instanceof Array) {
            eventNames = eventNameOrNames;
        }
        else {
            eventNames = [eventNameOrNames];
        }
        MetadataRegistry_1.defaultMetadataRegistry.addOnMetadata({
            object: object,
            methodName: methodName,
            eventNames: eventNames,
        });
    };
}
exports.On = On;
