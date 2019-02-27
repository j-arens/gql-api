import Koa from 'koa';
import 'reflect-metadata';
import './container';
import apollo from './deps/apollo';
import buildSchema from './deps/graphql';
import connectMysql from './deps/mysql';

export const bootstrap = async () => {
  await connectMysql();
  const schema = await buildSchema();
  const server = await apollo(schema);
  const app = new Koa();
  return {
    server,
    app,
  };
};
