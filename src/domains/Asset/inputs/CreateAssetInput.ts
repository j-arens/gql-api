import { InputType, Field } from 'type-graphql';
import { IsUUID } from 'class-validator';
import { Asset } from '../AssetEntity';
import { AssetClearance } from '../AssetClearance';
import { AssetLocation } from '../AssetLocation';

@InputType({ description: 'new asset data' })
export class CreateAssetInput implements Partial<Asset> {
  @Field()
  @IsUUID()
  productId: string;

  @Field()
  fileName: string;

  @Field()
  version: string;

  @Field(() => AssetClearance)
  clearance: AssetClearance;

  @Field(() => AssetLocation)
  location: AssetLocation;
}
