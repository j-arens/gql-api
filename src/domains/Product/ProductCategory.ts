import { registerEnumType } from 'type-graphql';

export enum ProductCategory {
  WORDPRESS = 'WORDPRESS',
  PLUGIN = 'PLUGIN',
  THEME = 'THEME',
}

registerEnumType(ProductCategory, {
  name: 'ProductCategory',
  description: 'product categories',
});
