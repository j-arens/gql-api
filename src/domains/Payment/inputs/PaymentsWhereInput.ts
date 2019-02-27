import { InputType, Field } from 'type-graphql';
import { Min, IsUUID } from 'class-validator';
import { Payment } from '../PaymentEntity';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { PaymentStatus } from '../PaymentStatus';

@InputType({ description: 'select multiple payments' })
export class PaymentsWhereInput extends PaginateInput implements Partial<Payment> {
  @Field({ nullable: true })
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @Min(0)
  amountEqualTo?: number;

  @Field({ nullable: true })
  @Min(0)
  amountGreaterThan?: number;

  @Field({ nullable: true })
  @Min(0)
  amountLessThan?: number;

  @Field(() => PaymentStatus, { nullable: true })
  status?: PaymentStatus;
}
