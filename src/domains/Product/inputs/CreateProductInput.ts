import { InputType, Field, Int } from 'type-graphql';
import { Min, IsUUID } from "class-validator";
import { Product } from '../ProductEntity';
import { ProductCategory } from '../ProductCategory';
import { ProductStatus } from '../ProductStatus';

@InputType({ description: 'new product data' })
export class CreateProductInput implements Partial<Product> {
  @Field()
  name: string;

  @Field()
  @Min(0)
  price: number;

  @Field(() => ProductStatus)
  status: ProductStatus;

  @Field(() => Int, { nullable: true })
  @Min(1)
  maxRegistrationsPerOrder?: number;

  @Field({ nullable: true })
  @IsUUID()
  userId?: string;

  @Field(() => [ProductCategory], { nullable: 'itemsAndList' })
  categories?: ProductCategory[];
}
