import braintree from '#/domains/Payment/braintree';
import { useContainer } from 'type-graphql';
import { Container } from 'typedi';
import connectRedis from './deps/redis';

useContainer(Container);

Container.set([
  { id: 'braintree', value: braintree },
  { id: 'redis', value: connectRedis() },
]);
