import { InputType, Field } from 'type-graphql';
import { IsUUID, Min } from 'class-validator';

@InputType({ description: 'new payment data' })
export class CreatePaymentInput {
  @Field()
  @IsUUID()
  orderId: string;

  @Field()
  nonce: string;

  @Field()
  @Min(0)
  expectedAmount: number;
}
