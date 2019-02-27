import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
} from 'type-graphql';
import { User } from '../User/UserEntity';
import { Product } from '../Product/ProductEntity';
import { Order } from '../Order/OrderEntity';

@ObjectType()
@Entity()
export class Registration extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.registrations, { nullable: false })
  user: User;

  @Field(() => Product)
  @ManyToOne(() => Product, product => product.registrations, { nullable: false })
  product: Product;

  @Field(() => Order)
  @ManyToOne(() => Order, order => order.registrations, { nullable: false })
  order: Order;

  @Field()
  @Column()
  domain: string;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
