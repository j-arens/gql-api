import faker from 'faker';
import { Permission } from '#/domains/User/Permission';
import * as roles from '#/domains/User/roles';
import { ProductStatus } from '#/domains/Product/ProductStatus';
import { AssetClearance } from '#/domains/Asset/AssetClearance';
import { AssetLocation } from '#/domains/Asset/AssetLocation';

// NOTE: array literals won't always work here, instead use the Array constructor
// this is due to typeorm using instanceof instead of Array.isArray and jest contexts

/**
 * MOCK USER
 */

interface PartialMockUser {
  email: string;
  verified: boolean;
  permissions: Permission[];
  password?: string;
}

export const partialMockUser = (): PartialMockUser => ({
  email: faker.internet.email().toLowerCase(),
  verified: false,
  permissions: Array(...roles.basic),
});

/**
 * MOCK PRODUCT
 */

interface PartialMockProduct {
  name: string;
  status: ProductStatus;
  price: number;
}

export const partialMockProduct = (): PartialMockProduct => ({
  name: faker.commerce.productName(),
  status: ProductStatus.ACTIVE,
  price: faker.random.number(),
});

/**
 * MOCK ASSET
 */

interface PartialMockAsset {
  fileName: string;
  version: string;
  clearance: AssetClearance;
  location: AssetLocation;
}

export const partialMockAsset = (): PartialMockAsset => ({
  fileName: faker.system.fileName(),
  version: faker.system.semver(),
  clearance: AssetClearance.PUBLIC,
  location: AssetLocation.INTERNAL,
});
