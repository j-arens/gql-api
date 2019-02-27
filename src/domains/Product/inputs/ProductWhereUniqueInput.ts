import { InputType, Field } from 'type-graphql';
import { IsUUID } from 'class-validator';
import { Product } from '../ProductEntity';

@InputType({ description: 'select product by name or id' })
export class ProductWhereUniqueInput implements Partial<Product> {
  @Field({ nullable: true })
  @IsUUID()
  id?: string;

  @Field({ nullable: true })
  name?: string;
}
