import { InputType, Field } from 'type-graphql';
import { IsEmail } from 'class-validator';
import { User } from '../UserEntity';

@InputType({ description: 'user authentication data' })
export class AuthenticateUserInput implements Partial<User> {
  @Field()
  @IsEmail()
  email: string;

  @Field({ nullable: true })
  password: string;
}
