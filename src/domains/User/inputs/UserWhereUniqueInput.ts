import { InputType, Field } from 'type-graphql';
import { IsEmail, IsUUID } from 'class-validator';
import { User } from '../UserEntity';

@InputType({ description: 'select user by email or id' })
export class UserWhereUniqueInput implements Partial<User> {
  @Field({ nullable: true })
  @IsUUID()
  id?: string;

  @Field({ nullable: true })
  @IsEmail()
  email?: string;
}
