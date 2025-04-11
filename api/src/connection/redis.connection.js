const redis = require('redis');
const { redisHost, redisPassword, redisPort } = require('../config');

const createRedisClient = (role) => {
    const client = redis.createClient({
        url: `redis://default:${redisPassword}@${redisHost}:${redisPort}`
    });
    client.on('connect', () => {
        console.log(`${role} Connecting to Redis ...`);
    })
        .on('ready', () => {
            console.log(`${role} Connected to Redis!`);
        })
        .on('reconnecting', () => {
            console.log(`${role} Reconnected to Redis!`);
        })
        .on('end', () => {
            console.log(`${role} Disconnected from Redis!`);
        })
        .on('error', (err) => {
            console.log(`${role} Redis error ... >> `, err);
        });

    return client;
};

const publisher = createRedisClient('Publisher');
const subscriber = createRedisClient('Subscriber');
const client = createRedisClient('Client');

module.exports = { publisher, subscriber, client };
