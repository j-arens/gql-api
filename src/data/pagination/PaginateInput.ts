import { Field, Int, InputType } from "type-graphql";
import { Min } from "class-validator";

@InputType()
export class PaginateInput {
  @Field(() => Int, { nullable: true })
  @Min(0)
  size?: number = 25;

  @Field(() => Int, { nullable: true })
  @Min(0)
  page?: number = 0;
}
