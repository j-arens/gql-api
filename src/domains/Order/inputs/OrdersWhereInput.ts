import { InputType, Field } from 'type-graphql';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { Min, IsUUID } from 'class-validator';

@InputType({ description: 'select multiple orders' })
export class OrdersWhereInput extends PaginateInput {
  @Field({ nullable: true })
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @Min(0)
  totalGreaterThan?: number;

  @Field({ nullable: true })
  @Min(0)
  totalLessThan?: number;

  @Field({ nullable: true })
  @Min(0)
  totalEqualTo?: number;

  @Field({ nullable: true })
  @IsUUID()
  productId?: string;
}
