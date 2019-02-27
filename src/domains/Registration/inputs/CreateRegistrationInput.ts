import { InputType, Field } from 'type-graphql';
import { IsUUID } from 'class-validator';

@InputType({ description: 'new registration data' })
export class CreateRegistrationInput {
  @Field()
  @IsUUID()
  userId: string;
  
  @Field()
  @IsUUID()
  orderId: string;

  @Field()
  @IsUUID()
  productId: string;
}
