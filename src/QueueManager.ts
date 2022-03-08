import { Channel, ConsumeMessage } from "amqplib";
import { ConsumerHandler, EventMessage } from "./types";

export class QueueManager {
  constructor(
    private readonly channel: Channel,

    private readonly exchange: string = "mp.events",

    private readonly queueName: string = "mp.events"
  ) {
    if (!this.channel) {
      throw new Error(`Channel is not defined`);
    }

    if (!this.exchange) {
      throw new Error(`Events exchange name is not defined`);
    }
  }

  private queueReady = false;

  private subRunning = false;

  private async initExchange() {
    await Promise.all([
      this.channel.assertExchange(this.exchange, "topic", {
        durable: true,
        autoDelete: false,
      }),
      this.channel.assertQueue(this.queueName, {
        durable: true,
        autoDelete: false,
        expires: undefined,
        messageTtl: 30 * 24 * 60 * 60 * 1000, // 30 days
      }),
    ]);

    await this.channel.bindQueue(this.queueName, this.exchange, "*.*.*");

    this.queueReady = true;
  }

  public async publishEvent(
    routingKeys: string[],
    content: unknown
  ): Promise<void> {
    if (!this.queueReady) {
      await this.initExchange();
    }

    const encodedBody = Buffer.from(JSON.stringify(content));

    routingKeys.forEach((routingKey) => {
      this.channel.publish(this.exchange, routingKey, encodedBody, {
        persistent: true,
      });
    });
  }

  public async subscribe(handler: ConsumerHandler) {
    if (!this.queueReady) {
      await this.initExchange();
    }

    if (this.subRunning) {
      this.subRunning = true;

      return;
    }

    const consume = (msg: ConsumeMessage | null) => {
      if (msg === null) {
        return;
      }

      this.doWork(handler, msg);
    };

    await this.channel.prefetch(1);
    await this.channel.consume(this.queueName, consume);
  }

  private async doWork(
    handler: ConsumerHandler,
    msg: ConsumeMessage
  ): Promise<void> {
    try {
      const message: EventMessage = {
        routingKey: msg.fields.routingKey,
        content: JSON.parse(msg.content.toString()),
      };

      await handler(message);

      this.channel.ack(msg);
    } catch (e: any) {
      console.error(e?.message);
      this.channel.nack(msg, false, true);
    }
  }
}
