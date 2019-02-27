import { buildSchema } from 'type-graphql';
import * as path from 'path';

export default () => buildSchema({
  // emitSchemaFile: true,
  resolvers: [
    path.join(__dirname, '../../domains/**/*Resolver.ts'),
  ],
});
