import { InputType, Field } from 'type-graphql';
import { IsUUID } from 'class-validator';
import { Asset } from '../AssetEntity';
import { PaginateInput } from '#/data/pagination/PaginateInput';
import { AssetClearance } from '../AssetClearance';
import { AssetLocation } from '../AssetLocation';

@InputType({ description: 'select multiple assets' })
export class AssetsWhereInput extends PaginateInput implements Partial<Asset> {
  @Field({ nullable: true })
  @IsUUID()
  productId?: string;

  @Field({ nullable: true })
  fileName?: string;

  @Field({ nullable: true })
  version?: string;

  @Field(() => AssetClearance, { nullable: true })
  clearance?: AssetClearance;

  @Field(() => AssetLocation, { nullable: true })
  location?: AssetLocation;
}
