import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  OneToMany,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
} from 'type-graphql';
import { Permission } from './Permission';
import { Order } from '../Order/OrderEntity';
import { Product } from '../Product/ProductEntity';
import { Payment } from '../Payment/PaymentEntity';
import { Registration } from '../Registration/RegistrationEntity';

@ObjectType()
@Entity()
export class User extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column({ unique: true })
  email: string;

  @Column({ nullable: true })
  password: string;

  @Field()
  @Column({ default: false })
  verified: boolean;

  @Field(() => [Permission])
  @Column('simple-array')
  permissions: Permission[];

  @Field(() => [Order], { nullable: 'items' })
  @OneToMany(() => Order, order => order.user) // { cascade: true }??
  orders: Order[];

  @Field(() => [Product], { nullable: 'items' })
  @OneToMany(() => Product, product => product.user) // { cascade: true }??
  products: Product[];

  @Field(() => [Payment], { nullable: 'items' })
  @OneToMany(() => Payment, payment => payment.user)
  payments: Payment[];

  @Field(() => [Registration], { nullable: 'items' })
  @OneToMany(() => Registration, registration => registration.user)
  registrations: Registration[];

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
