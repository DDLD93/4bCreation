const { publisher, subscriber, client } = require("../connection/redis.connection");

class RedisCTRL {
    constructor() {
        this.#init();
    }

    async #init() {
        try {
            await Promise.all([
                publisher.connect(),
                subscriber.connect(),
                client.connect()
            ]);
            console.log("All Redis clients connected successfully.");
        } catch (error) {
            console.error("Error connecting to Redis clients:", error);
        }
    }

    async write(key, value, option = {}) {
        try {
            await client.set(key, value, option);
            console.log(`Key ${key} set successfully.`);
        } catch (error) {
            console.error(`Error setting key ${key}:`, error);
        }
    }

    async read(key) {
        try {
            const value = await client.get(key);
            console.log(`Key ${key} read successfully.`);
            return value;
        } catch (error) {
            console.error(`Error reading key ${key}:`, error);
            return null;
        }
    }

    async plish(chan, msg) {
        try {
            await publisher.publish(chan, JSON.stringify(msg));
            console.log(`Message published to channel ${chan} successfully.`);
        } catch (error) {
            console.error(`Error publishing to channel ${chan}:`, error);
        }
    }

    async subs(subscribedChannel, cb) {
        try {
            await subscriber.subscribe(subscribedChannel, cb);
            console.log(`Subscribed to channel ${subscribedChannel} successfully.`);
        } catch (error) {
            console.error(`Error subscribing to channel ${subscribedChannel}:`, error);
        }
    }
}

module.exports = new RedisCTRL();
