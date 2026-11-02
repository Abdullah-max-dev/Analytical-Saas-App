// Shared by every module through Node's CommonJS module cache.
const handlers = new Map();

const validateEventName = (eventName) => {
    if (typeof eventName !== "string" || eventName.trim().length === 0) {
        throw new TypeError("Event name must be a non-empty string");
    }
};

const register = (eventName, handler) => {
    validateEventName(eventName);
    if (typeof handler !== "function") {
        throw new TypeError("Event handler must be a function");
    }

    if (!handlers.has(eventName)) handlers.set(eventName, new Set());
    handlers.get(eventName).add(handler);

    // Calling this more than once is safe.
    return () => {
        const subscribers = handlers.get(eventName);
        if (!subscribers) return;
        subscribers.delete(handler);
        if (subscribers.size === 0) handlers.delete(eventName);
    };
};

// Snapshot subscriptions so changes during publication affect the next event.
const getHandlers = (eventName) => {
    validateEventName(eventName);
    return Array.from(handlers.get(eventName) || []);
};

module.exports = { register, getHandlers };
