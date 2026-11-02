# Shared application events

Import `publish` and `register` from this directory in any backend module.
Use descriptive event names such as `sale.created` or `inventory.updated`.

```js
const { publish, register } = require("../../../events");

// Register module handlers once at startup, before accepting requests.
const unsubscribe = register("sale.created", async (sale) => {
    await updateAnalytics(sale);
});

// Publish only after the sale's database transaction has committed.
await publish("sale.created", createdSale);

// Remove the handler when it is no longer needed.
unsubscribe();
```

Registering the same function for the same event twice runs it once. Different
functions can subscribe to the same event. Handlers receive the published payload,
run concurrently, and are all awaited. Publishing without subscribers returns an
empty array. Successful publication returns handler results in registration order.
If handlers fail, publication rejects with an `AggregateError` containing their
errors after all handlers finish. Callers must await or catch publication failures.
An event failure after a database commit does not undo that commit; account for
that when reporting errors or retrying a business operation.

This bus runs inside one Node process. It does not persist events, retry failures,
or deliver to other server processes. Register actual analytics handlers when the
analytics service is implemented; this directory does not write analytics data.
