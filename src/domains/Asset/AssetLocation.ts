import { registerEnumType } from 'type-graphql';

export enum AssetLocation {
  GCLOUDSTORAGE = 'GLOUDSTORAGE',
  INTERNAL = 'INTERNAL',
}

registerEnumType(AssetLocation, {
  name: 'AssetLocation',
  description: 'payment status',
});
