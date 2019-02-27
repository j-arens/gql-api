import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  OneToOne,
  JoinColumn,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
  Int,
} from 'type-graphql';
import { User } from '../User/UserEntity';
import { Order } from '../Order/OrderEntity';
import { PaymentStatus } from './PaymentStatus';

@ObjectType()
@Entity()
export class Payment extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => ID)
  @Column({ unique: true })
  transactionId: string;

  @Field(() => User)
  @ManyToOne(() => User, user => user.payments, { nullable: false })
  user: User;

  @Field(() => Order)
  @OneToOne(() => Order, { nullable: false })
  @JoinColumn()
  order: Order;

  @Field(() => Int)
  @Column()
  amount: number;

  @Field(() => PaymentStatus)
  @Column({ type: 'enum', enum: PaymentStatus })
  status: PaymentStatus;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
