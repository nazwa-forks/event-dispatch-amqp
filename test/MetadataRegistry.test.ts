import { defaultMetadataRegistry } from "../src/MetadataRegistry";

describe("MetadataRegistry", () => {
  require("./FakeClass");

  describe("#collectEventsHandlers", () => {
    test("Single event mapping", () => {
      const result = defaultMetadataRegistry.getHandlersForEvent("test-event");

      expect(result).toStrictEqual([
        {
          callback: expect.anything(),
          eventName: "test-event",
          methodName: "testMethod",
          subscriberName: "FakeClass",
        },
      ]);
    });

    test("Nothing for an unknown event", () => {
      const result =
        defaultMetadataRegistry.getHandlersForEvent("unknown-event");

      expect(result).toStrictEqual([]);
    });

    test("Multiple handlers", () => {
      const result =
        defaultMetadataRegistry.getHandlersForEvent("another-event");

      expect(result).toStrictEqual([
        {
          callback: expect.anything(),
          eventName: "another-event",
          methodName: "otherEvent",
          subscriberName: "FakeClass",
        },
        {
          callback: expect.anything(),
          eventName: "another-event",
          methodName: "anotherEvent",
          subscriberName: "FakeClass",
        },
      ]);
    });
  });

  describe("#getHandlersForEventWithSubscriber", () => {
    test("Get single handler", () => {
      const result = defaultMetadataRegistry.getHandlersForEventWithSubscriber(
        "FakeClass",
        "testMethod",
        "test-event"
      );

      expect(result).toStrictEqual([
        {
          callback: expect.anything(),
          eventName: "test-event",
          methodName: "testMethod",
          subscriberName: "FakeClass",
        },
      ]);
    });

    test("Get single handler for event with multiple handlers", () => {
      const result = defaultMetadataRegistry.getHandlersForEventWithSubscriber(
        "FakeClass",
        "anotherEvent",
        "another-event"
      );

      expect(result).toStrictEqual([
        {
          callback: expect.anything(),
          eventName: "another-event",
          methodName: "anotherEvent",
          subscriberName: "FakeClass",
        },
      ]);
    });

    test("Get empty handler", () => {
      const result = defaultMetadataRegistry.getHandlersForEventWithSubscriber(
        "FakeClass",
        "testMethod",
        "another-event"
      );

      expect(result).toStrictEqual([]);
    });
  });
});
