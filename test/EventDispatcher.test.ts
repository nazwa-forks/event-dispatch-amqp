import { EventDispatcher } from "../src/EventDispatcher";
import { defaultMetadataRegistry } from "../src/MetadataRegistry";
import { QueueManager } from "../src/QueueManager";
import { EventsHandler } from "../src/types";

describe("EventDispatcher", () => {
  let dispatcher: EventDispatcher;

  const someData = { x: "some-data" };

  const handlers: EventsHandler[] = [
    {
      callback: jest.fn(),
      eventName: "another-event",
      methodName: "otherEvent",
      subscriberName: "FakeClass",
    },
    {
      callback: jest.fn(),
      eventName: "another-event",
      methodName: "anotherEvent",
      subscriberName: "FakeClass",
    },
  ];

  beforeEach(() => {
    dispatcher = new EventDispatcher();
  });

  afterEach(() => {
    jest.resetAllMocks();
  });

  describe("#isEventWhitelistedForRemote", () => {
    test("Allowed with empty list", () => {
      const result = dispatcher.isEventWhitelistedForRemote("fake-test");
      expect(result).toEqual(true);
    });

    test("Allowed when on the list", () => {
      dispatcher.setRemoteEventWhitelist(["allowed-event"]);
      const result = dispatcher.isEventWhitelistedForRemote("allowed-event");

      expect(result).toEqual(true);
    });

    test("Not allowed when not on list", () => {
      dispatcher.setRemoteEventWhitelist(["allowed-event"]);
      const result =
        dispatcher.isEventWhitelistedForRemote("not-allowed-event");

      expect(result).toEqual(false);
    });
  });

  describe("#dispatch", () => {
    test("Should dispatch multiple events remotely", async () => {
      jest.spyOn(dispatcher, "isQueueEnabled").mockReturnValue(true);
      jest
        .spyOn(dispatcher, "isEventWhitelistedForRemote")
        .mockReturnValue(true);
      jest
        .spyOn(defaultMetadataRegistry, "getHandlersForEvent")
        .mockReturnValue(handlers);

      const publishEventMock = jest.fn();

      dispatcher.setQueueManager({
        publishEvent: publishEventMock,
      } as any as QueueManager);

      const result = dispatcher.dispatch("another-event", someData);

      expect(result).resolves.toBe(undefined);

      expect(publishEventMock).toHaveBeenCalledTimes(1);
      expect(publishEventMock).toHaveBeenCalledWith(
        [
          "another-event.FakeClass.otherEvent",
          "another-event.FakeClass.anotherEvent",
        ],
        someData
      );

      expect(handlers[0].callback).not.toHaveBeenCalled();
      expect(handlers[1].callback).not.toHaveBeenCalled();
    });

    test("Should dispatch multiple events locally", async () => {
      jest.spyOn(dispatcher, "isQueueEnabled").mockReturnValue(true);
      jest
        .spyOn(dispatcher, "isEventWhitelistedForRemote")
        .mockReturnValue(false);
      jest
        .spyOn(defaultMetadataRegistry, "getHandlersForEvent")
        .mockReturnValue(handlers);

      const publishEventMock = jest.fn();

      dispatcher.setQueueManager({
        publishEvent: publishEventMock,
      } as any as QueueManager);

      const result = dispatcher.dispatch("another-event", someData);

      expect(result).resolves.toBe(undefined);

      expect(publishEventMock).not.toHaveBeenCalled();

      expect(handlers[0].callback).toHaveBeenCalledWith(someData);
      expect(handlers[1].callback).toHaveBeenCalledWith(someData);
    });
  });

  describe("#executeSingleHandler", () => {
    test("Single remote handler", async () => {
      const getterMock = jest
        .spyOn(defaultMetadataRegistry, "getHandlersForEventWithSubscriber")
        .mockReturnValue(handlers);

      const subscriber = "FakeClass";
      const method = "anotherEvent";
      const event = "another-event";

      await dispatcher.executeSingleHandler({
        routingKey: `${event}.${subscriber}.${method}`,
        content: someData,
      });

      expect(getterMock).toHaveBeenCalledTimes(1);
      expect(getterMock).toHaveBeenCalledWith(
        "FakeClass",
        "anotherEvent",
        "another-event"
      );

      expect(handlers[0].callback).toHaveBeenCalledWith(someData);
      expect(handlers[1].callback).toHaveBeenCalledWith(someData);
    });
  });
});
