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
import { Product } from '../Product/ProductEntity';
import { AssetClearance } from './AssetClearance';
import { AssetLocation } from './AssetLocation';

@ObjectType()
@Entity()
export class Asset extends BaseEntity {
  @Field(() => ID)
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Field(() => Product)
  @ManyToOne(() => Product, product => product.assets, { nullable: false })
  product: Product;

  @Field()
  @Column()
  fileName: string;

  @Field()
  @Column()
  version: string;

  @Field(() => AssetClearance)
  @Column({ type: 'enum', enum: AssetClearance })
  clearance: AssetClearance;

  @Field(() => AssetLocation)
  @Column({ type: 'enum', enum: AssetLocation })
  location: AssetLocation;

  @Field()
  @CreateDateColumn()
  createdAt: string;

  @Field()
  @UpdateDateColumn()
  updatedAt: string;
}
