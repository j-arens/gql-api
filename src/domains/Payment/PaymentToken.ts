import { ObjectType, Field } from 'type-graphql';

@ObjectType()
export class PaymentToken {
  constructor(token: string) {
    this.token = token;
  }

  @Field()
  token: string;
}
