type EventHandler = (data?: any) => void;

export class EventBus {
    private static instance: EventBus;
    private events: { [key: string]: EventHandler[] } = {};

    private constructor() {}

    public static getInstance(): EventBus {
        if (!EventBus.instance) {
            EventBus.instance = new EventBus();
        }
        return EventBus.instance;
    }

    public on(event: string, callback: EventHandler): void {
        if (!this.events[event]) {
            this.events[event] = [];
        }
        this.events[event].push(callback);
    }

    public off(event: string, callback: EventHandler): void {
        if (!this.events[event]) {
            return;
        }
        this.events[event] = this.events[event].filter(
            (handler) => handler !== callback
        );
    }

    public emit(event: string, data?: any): void {
        if (!this.events[event]) {
            return;
        }
        this.events[event].forEach((callback) => {
            try {
                callback(data);
            } catch (error) {
                console.error(`Error in event handler for ${event}:`, error);
            }
        });
    }
}
