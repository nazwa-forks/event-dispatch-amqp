import { EventSubscriber, On } from "../src/decorators";

/**
 * Helper class to validate the subscribers in tests
 */
@EventSubscriber()
export class FakeClass {
  @On("test-event")
  testMethod() {
    //
  }

  normalMethod() {
    //
  }

  @On(["other-event", "another-event"])
  otherEvent() {
    //
  }

  @On("another-event")
  anotherEvent() {
    //
  }
}
