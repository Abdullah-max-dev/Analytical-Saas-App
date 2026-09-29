require("dotenv").config()
const connectDB = require("./db/db");
const app = require("./src/app")
const { connectRedis } = require("./src/config/redis.config");



const startServer = async () => {
    try {
        await connectDB();
        await connectRedis();

        app.listen(3000, () => {
            console.log("Server running on port 3000");
        });

    } catch (error) {
        console.error("Server startup error:", error);
        process.exit(1);
    }
};

startServer();

