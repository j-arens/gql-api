import { InputType, Field } from 'type-graphql';
import { IsEmail } from 'class-validator';
import { User } from '../UserEntity';
import { Permission } from '../Permission';

@InputType({ description: 'new user data' })
export class CreateUserInput implements Partial<User> {
  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  password?: string;

  @Field(() => [Permission])
  permissions: Permission[];

  @Field({ nullable: true })
  verified?: boolean;
}
