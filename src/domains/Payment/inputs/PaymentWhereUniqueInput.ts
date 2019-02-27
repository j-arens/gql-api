import { InputType, Field } from 'type-graphql';
import { IsUUID } from 'class-validator';
import { Payment } from '../PaymentEntity';

@InputType({ description: 'select payment by id or transaction id' })
export class PaymentWhereUniqueInput implements Partial<Payment> {
  @Field({ nullable: true })
  @IsUUID()
  id?: string;

  @Field({ nullable: true })
  transactionId?: string;
}
