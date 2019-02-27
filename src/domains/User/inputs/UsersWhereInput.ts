import { InputType, Field } from 'type-graphql';
import { User } from '../UserEntity';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { Permission } from '../Permission';

@InputType({ description: 'select multiple users' })
export class UsersWhereInput extends PaginateInput implements Partial<User> {
  @Field({ nullable: true })
  verified?: boolean;

  @Field(() => [Permission], { nullable: true })
  permissionIn?: Permission[];

  @Field(() => [Permission], { nullable: true })
  permissionNotIn?: Permission[];
}
