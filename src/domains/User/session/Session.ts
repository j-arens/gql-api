import { Container, Inject } from 'typedi';
import { RedisClient } from 'redis';
import uuid from 'uuid';
import { parse, create } from './token';

interface SessionParams {
  id?: string;
  expires?: Date;
  userId?: string;
  token?: string;
}

const ONE_DAY_MS = 1000 * 60 * 60 * 24; 

export default class Session {
  static async fromCookie(cookie: string): Promise<Session> {
    const redis = Container.get<RedisClient>('redis');
    const sessionId = parse(cookie);
    return new Promise<Session>((res, rej) => {
      redis.hgetall(sessionId, (err, stored) => {
        if (err) {
          rej(err);
        }
        if (!stored) {
          rej(new Error('session does not exist'));
        }
        res(new Session({
          id: sessionId,
          userId: stored.userId,
          expires: new Date(stored.expires),
          token: cookie,
        }));
      });
    });
  }

  constructor(input: SessionParams = {}) {    
    const opts = Object.assign({
      id: uuid.v4(),
      expires: new Date(Date.now() + ONE_DAY_MS),
      userId: '',
      token: '',
    }, input);

    this._id = opts.id;
    this._expires = opts.expires;
    this._userId = opts.userId;
    this._token = opts.token;
  }

  protected _id: string;

  protected _expires: Date;

  protected _userId: string;

  protected _token: string;

  @Inject('redis')
  redis: RedisClient;

  get userId() {
    return this._userId;
  }

  get token() {
    if (!this._token) {
      this._token = create(this._id);
    }
    return this._token;
  }

  async store() {
    const multi = this.redis.multi();
    const expires = this._expires.getTime();
    multi.HMSET(this._id, {
      userId: this._userId,
      expires,
    });
    multi.expire(this._id, expires);
    await multi.exec();
  }

  valid(): boolean {
    if (!this._userId || this.expired()) {
      return false;
    }
    return true;
  }

  expired(): boolean {
    // @ts-ignore
    return Date.now() >= this._expires;
  }
}
