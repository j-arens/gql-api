import redis from 'redis';
// import { promisify } from 'util';

const config = {
  host: process.env.REDIS_HOST,
  port: parseInt(process.env.REDIS_PORT || '6379', 10),
  password: process.env.REDIS_PASS || undefined,
  // db: process.env.REDIS_DB,
};

export default () => {
  const client = redis.createClient(config);
  // @TODO: promisify async redis methods
  return client;
};
