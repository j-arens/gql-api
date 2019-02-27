import { registerEnumType } from 'type-graphql';

export enum AssetClearance {
  PUBLIC = 'PUBLIC',
  PRIVATE = 'PRIVATE',
  PROTECTED = 'PROTECTED',
  TECH = 'TECH',
}

registerEnumType(AssetClearance, {
  name: 'AssetClearance',
  description: 'payment status',
});
