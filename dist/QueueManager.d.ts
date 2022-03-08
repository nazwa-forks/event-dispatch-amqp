import { Channel } from "amqplib";
import { ConsumerHandler } from "./types";
export declare class QueueManager {
    private readonly channel;
    private readonly exchange;
    private readonly queueName;
    constructor(channel: Channel, exchange?: string, queueName?: string);
    private queueReady;
    private subRunning;
    private initExchange;
    publishEvent(routingKeys: string[], content: unknown): Promise<void>;
    subscribe(handler: ConsumerHandler): Promise<void>;
    private doWork;
}
