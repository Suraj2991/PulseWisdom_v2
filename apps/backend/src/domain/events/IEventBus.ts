/**
 * Interface for the event bus system
 * Handles publishing and subscribing to events
 */
export interface IEventBus {
  /**
   * Publishes an event to all subscribers
   * @param eventName The name of the event to publish
   * @param data The data to publish with the event
   */
  publish<T>(eventName: string, data: T): void;

  /**
   * Subscribes to an event
   * @param eventName The name of the event to subscribe to
   * @param callback The callback function to execute when the event is published
   * @returns A function to unsubscribe from the event
   */
  subscribe<T>(eventName: string, callback: (data: T) => void): () => void;

  /**
   * Unsubscribes from an event
   * @param eventName The name of the event to unsubscribe from
   * @param callback The callback function to remove
   */
  unsubscribe<T>(eventName: string, callback: (data: T) => void): void;
} 