import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  ManyToMany,
  JoinTable,
  OneToMany,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
  Int,
} from 'type-graphql';
import { User } from '../User/UserEntity';
import { Product } from '../Product/ProductEntity';
import { Registration } from '../Registration/RegistrationEntity';

@ObjectType()
@Entity()
export class Order extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.orders, { nullable: false })
  user: User;

  @Field(() => [Product])
  @ManyToMany(() => Product)
  @JoinTable({ name: 'ordersToProducts' })
  products: Product[];

  @Field(() => [Registration], { nullable: 'items' })
  @OneToMany(() => Registration, registration => registration.order)
  registrations: Registration[]

  @Field(() => Int)
  @Column()
  tax: number;

  @Field(() => Int)
  @Column()
  total: number;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
