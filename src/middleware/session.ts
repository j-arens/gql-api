import Session from '#/domains/User/session/Session';
import { Context } from 'koa';

export const getSessionCookie = async (ctx: Context, next: () => Promise<any>) => {
  const cookie = ctx.cookies.get(process.env.SESSION_COOKIE || '', { signed: true });
  try {
    ctx.session = await Session.fromCookie(cookie);
  } catch (err) {
    ctx.session = new Session();
  }
  await next();
};

export const setSessionCookie = async (ctx: Context, next: () => Promise<any>) => {
  await next();
  const cookie = ctx.cookies.get(process.env.SESSION_COOKIE || '', { signed: true });
  const session = ctx.session;
  if (session.valid() && !cookie) {
    ctx.cookies.set(process.env.SESSION_COOKIE || '', session.token, {
      signed: true,
      secure: true,
      httpOnly: true,
      expires: new Date(), // @TODO
      sameSite: 'lax', // @TODO?
      // maxAge: ''
      // domain: ''
    });
  }
};

export const expireSessionCookie = async (ctx: Context, next: () => Promise<any>) => {
  await next();
  const cookie = ctx.cookies.get(process.env.SESSION_COOKIE || '', { signed: true });
  const session = ctx.session;
  if (cookie && !session.valid()) {
    ctx.cookies.set(process.env.SESSION_COOKIE || '', '');
  }
};
