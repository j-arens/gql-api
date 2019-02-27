import { ApolloServer } from 'apollo-server-koa';
import { GraphQLSchema } from 'graphql';
import { CtxParams, Ctx } from '../type';

export default (schema: GraphQLSchema) => new ApolloServer({
  schema,
  context: ({ session, request }: CtxParams): Ctx => ({
    session,
    request,
  }),
  playground: true, // @TODO
  debug: true, // @TODO
});
