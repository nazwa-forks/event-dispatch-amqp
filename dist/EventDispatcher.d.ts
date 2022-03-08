import { QueueManager } from "./QueueManager";
import { EventMessage } from "./types";
export interface EventDispatcherOptions {
    queueManager?: QueueManager;
    remoteEventWhitelist?: string[];
}
export declare class EventDispatcher {
    private queueManager?;
    private remoteEventWhitelist?;
    private handlers;
    setQueueManager(queueManager: QueueManager): void;
    setRemoteEventWhitelist(remoteEventWhitelist: string[]): void;
    isQueueEnabled(): boolean;
    isEventWhitelistedForRemote(eventName: string): boolean;
    attach(attachTo: any, eventName: string, callback: (data: any) => void): void;
    attach(attachTo: any, eventNames: string[], callback: (data: any) => void): void;
    on(eventName: string, callback: (data: any) => void): void;
    on(eventNames: string[], callback: (data: any) => void): void;
    dispatch<T>(eventName: string, data?: T): Promise<void>;
    dispatch<T>(eventNames: string[], data?: T): Promise<void>;
    dispatchSingleEvent<T>(eventName: string, data?: T): Promise<void>;
    private dispatchSingleEventLocally;
    private dispatchSingleEventRemotely;
    executeSingleHandler(message: EventMessage): Promise<void>;
    setUpConsumer: (index: number) => void;
    activateQueueSubscriber(consumerCount: number): void;
}
