const { getHandlers } = require("./register");

// Await publication to know when all synchronous and asynchronous handlers finish.
const publish = async (eventName, payload) => {
    const handlers = getHandlers(eventName);
    const results = await Promise.allSettled(
        handlers.map((handler) => Promise.resolve().then(() => handler(payload)))
    );
    const failures = results
        .filter((result) => result.status === "rejected")
        .map((result) => result.reason);

    // One failing subscriber must not prevent the others from running.
    if (failures.length > 0) {
        throw new AggregateError(failures, `Event "${eventName}" failed in ${failures.length} handler(s)`);
    }

    return results.map((result) => result.value);
};

module.exports = { publish };
