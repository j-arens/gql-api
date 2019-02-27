import { Context, Request } from 'koa';

export interface Session {
  session: {
    userId?: string;
  };
}

export type CtxParams = Context & Session;

export interface Ctx extends Session {
  request: Request;
}
