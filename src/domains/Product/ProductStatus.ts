import { registerEnumType } from 'type-graphql';

export enum ProductStatus {
  ACTIVE = 'ACTIVE',
  DISCONTINUED = 'DISCONTINUED',
}

registerEnumType(ProductStatus, {
  name: 'ProductStatus',
  description: 'product status',
});
