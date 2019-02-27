import { InputType, Field, Int } from 'type-graphql';
import { Min } from "class-validator";
import { Product } from '../ProductEntity';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { ProductCategory } from '../ProductCategory';
import { ProductStatus } from '../ProductStatus';

@InputType({ description: 'select multiple products' })
export class ProductsWhereInput extends PaginateInput implements Partial<Product> {
  @Field(() => [ProductCategory], { nullable: true })
  categoryIn?: ProductCategory[];

  @Field(() => [ProductCategory], { nullable: true })
  categoryNotIn?: ProductCategory[];

  @Field(() => ProductStatus, { nullable: true })
  status?: ProductStatus;

  @Field(() => Int, { nullable: true })
  @Min(1)
  maxRegistrationsPerOrder?: number;

  @Field({ nullable: true })
  @Min(0)
  price?: number;
}
