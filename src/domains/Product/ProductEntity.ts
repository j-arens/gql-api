import {
  Entity,
  PrimaryGeneratedColumn,
  Column,
  BaseEntity,
  UpdateDateColumn,
  CreateDateColumn,
  ManyToOne,
  OneToMany,
} from 'typeorm';
import {
  ObjectType,
  Field,
  ID,
  Int,
} from 'type-graphql';
import { User } from '../User/UserEntity';
import { ProductCategory } from './ProductCategory';
import { ProductStatus } from './ProductStatus';
import { Asset } from '../Asset/AssetEntity';
import { Registration } from '../Registration/RegistrationEntity';

@ObjectType()
@Entity()
export class Product extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field()
  @Column()
  price: number;

  @Field(() => User)
  @ManyToOne(() => User, user => user.products)
  user: User;

  @Field(() => [Asset], { nullable: 'items' })
  @OneToMany(() => Asset, asset => asset.product)
  assets: Asset[];

  @Field(() => [Registration], { nullable: 'items' })
  @OneToMany(() => Registration, registration => registration.product)
  registrations: Registration[];

  @Field(() => [ProductCategory], { nullable: 'items' })
  @Column('simple-array', { nullable: true })
  categories: ProductCategory[];

  @Field()
  @Column({ unique: true })
  name: string;

  @Field(() => ProductStatus)
  @Column({ type: 'enum', enum: ProductStatus })
  status: ProductStatus;

  @Field(() => Int, { nullable: true })
  @Column({ nullable: true })
  maxRegistrationsPerOrder: number;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
