const test = require("node:test");
const assert = require("node:assert/strict");
const { publish, register } = require("./index");

test("publication awaits handlers and preserves the payload", async () => {
    const payload = { organizationId: "org-1" };
    let received;
    const unsubscribe = register("test.async", async (value) => {
        await new Promise((resolve) => setImmediate(resolve));
        received = value;
        return "done";
    });
    try {
        assert.deepEqual(await publish("test.async", payload), ["done"]);
        assert.equal(received, payload);
    } finally {
        unsubscribe();
    }
});

test("duplicate registration, event isolation, and unsubscribe", async () => {
    let calls = 0;
    const handler = () => ++calls;
    const unsubscribe = register("test.subscription", handler);
    register("test.subscription", handler);
    assert.deepEqual(await publish("test.unrelated"), []);
    assert.deepEqual(await publish("test.subscription"), [1]);
    unsubscribe();
    unsubscribe();
    assert.deepEqual(await publish("test.subscription"), []);
});

test("all subscribers complete even when sync and async handlers fail", async () => {
    const syncError = new Error("sync failure");
    const asyncError = new Error("async failure");
    let completed = false;
    const subscriptions = [
        register("test.failure", () => { throw syncError; }),
        register("test.failure", async () => { throw asyncError; }),
        register("test.failure", async () => {
            await new Promise((resolve) => setImmediate(resolve));
            completed = true;
        })
    ];
    try {
        await assert.rejects(publish("test.failure"), (error) => {
            assert.ok(error instanceof AggregateError);
            assert.deepEqual(error.errors, [syncError, asyncError]);
            assert.equal(completed, true);
            return true;
        });
    } finally {
        subscriptions.forEach((unsubscribe) => unsubscribe());
    }
});

test("invalid event names and handlers are rejected", async () => {
    assert.throws(() => register(" ", () => {}), TypeError);
    assert.throws(() => register("test.invalid", null), TypeError);
    await assert.rejects(publish(null), TypeError);
});
