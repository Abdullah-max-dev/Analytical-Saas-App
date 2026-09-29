const { createClient } = require("redis");

const redisClient = createClient({
    url: process.env.REDIS_URL || "redis://localhost:6379"
});

redisClient.on("error", (error) => {
    console.error("Redis Error:", error);
});

const connectRedis = async () => {
    if (!redisClient.isOpen) {
        await redisClient.connect();
        console.log("Redis connected");
    }
};

module.exports = {
    redisClient,
    connectRedis
};