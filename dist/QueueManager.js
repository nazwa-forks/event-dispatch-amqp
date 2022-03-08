"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.QueueManager = void 0;
class QueueManager {
    constructor(channel, exchange = "mp.events", queueName = "mp.events") {
        this.channel = channel;
        this.exchange = exchange;
        this.queueName = queueName;
        this.queueReady = false;
        this.subRunning = false;
        if (!this.channel) {
            throw new Error(`Channel is not defined`);
        }
        if (!this.exchange) {
            throw new Error(`Events exchange name is not defined`);
        }
    }
    async initExchange() {
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
    async publishEvent(routingKeys, content) {
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
    async subscribe(handler) {
        if (!this.queueReady) {
            await this.initExchange();
        }
        if (this.subRunning) {
            this.subRunning = true;
            return;
        }
        const consume = (msg) => {
            if (msg === null) {
                return;
            }
            this.doWork(handler, msg);
        };
        await this.channel.prefetch(1);
        await this.channel.consume(this.queueName, consume);
    }
    async doWork(handler, msg) {
        try {
            const message = {
                routingKey: msg.fields.routingKey,
                content: JSON.parse(msg.content.toString()),
            };
            await handler(message);
            this.channel.ack(msg);
        }
        catch (e) {
            console.error(e?.message);
            this.channel.nack(msg, false, true);
        }
    }
}
exports.QueueManager = QueueManager;
