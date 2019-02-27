import { InputType, Field } from 'type-graphql';
import { Registration } from '../RegistrationEntity';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { IsUUID, IsUrl } from 'class-validator';

@InputType({ description: 'select multiple registrations' })
export class RegistrationsWhereInput extends PaginateInput implements Partial<Registration> {
  @Field({ nullable: true })
  @IsUUID()
  userId?: string;

  @Field({ nullable: true })
  @IsUUID()
  productId?: string;

  @Field({ nullable: true })
  @IsUUID()
  orderId?: string;

  @Field({ nullable: true })
  @IsUrl()
  domain?: string;
}
