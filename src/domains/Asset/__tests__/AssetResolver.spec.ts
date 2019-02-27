import { AssetResolver } from '../AssetResolver';
import { Asset } from '../AssetEntity';
import { Product } from '#/domains/Product/ProductEntity';
import { partialMockAsset, partialMockProduct, partialMockUser } from '#dev/test-utils/helpers';
import { User } from '#/domains/User/UserEntity';
import { AssetClearance } from '../AssetClearance';
import { AssetLocation } from '../AssetLocation';

describe('AssetResolver', () => {
  describe('@Mutation createAsset', () => {
    it('throws an error if a product is not found', async () => {
      const asset = { ...partialMockAsset(), productId: '1234' };
      await expect(new AssetResolver().createAsset(asset)).rejects.toThrowError();
    });

    it('throws an error if the asset already exists', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const asset = { ...partialMockAsset(), product };
      await Asset.create(asset).save();
      const assetInput = { ...asset, productId: product.id };
      await expect(new AssetResolver().createAsset(assetInput)).rejects.toThrowError();
    });

    it('creates an asset', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const mock = partialMockAsset();
      const result = await new AssetResolver().createAsset({ ...mock, productId: product.id });
      expect(result).toMatchObject(mock);
    });
  });

  describe('@Query asset', () => {
    it('queries an asset by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const assetInput = { ...partialMockAsset(), product };
      const asset = await Asset.create(assetInput).save();
      const result = await new AssetResolver().asset(asset.id);
      expect(asset).toMatchObject(result!);
    });

    it('returns undefined if an asset is not found', async () => {
      const result = await new AssetResolver().asset('1234');
      expect(result).toBeUndefined();
    });
  });

  describe('@Query assets', () => {
    it('returns a paginated response', async () => {
      const result = await new AssetResolver().assets();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });

    it('queries all assets', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      await Promise.all(Array(5).fill(null).map(() => Asset.create({ ...partialMockAsset(), product }).save()));
      const result = await new AssetResolver().assets();
      expect(result!.total).toBe(5);
    });

    it('returns an empty array if no assets are found', async () => {
      const result = await new AssetResolver().assets();
      expect(Array.isArray(result!.data)).toBe(true);
      expect(result!.data.length).toBe(0);
    });

    it('queries assets by product id', async () => {
      const user = await User.create(partialMockUser()).save();
      const product1 = await Product.create({ ...partialMockProduct(), user }).save();
      const product2 = await Product.create({ ...partialMockProduct(), user }).save();
      const assets = [
        {
          ...partialMockAsset(),
          product: product1,
        },
        {
          ...partialMockAsset(),
          product: product1,
        },
        {
          ...partialMockAsset(),
          product: product2,
        }
      ];
      const created = await Promise.all(assets.map(asset => Asset.create(asset).save()));
      const result = await new AssetResolver().assets({ productId: product1.id });
      delete created[0].product; // @TODO
      delete created[1].product;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries assets by fileName', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const assets = [
        {
          ...partialMockAsset(),
          fileName: 'lol.js',
          product,
        },
        {
          ...partialMockAsset(),
          fileName: 'lol.js',
          version: '1.0.0.alpha-1',
          product,
        },
        {
          ...partialMockAsset(),
          product,
        }
      ];
      const created = await Promise.all(assets.map(asset => Asset.create(asset).save()));
      const result = await new AssetResolver().assets({ fileName: 'lol.js' });
      delete created[0].product; // @TODO
      delete created[1].product;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries assets by version', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const assets = [
        {
          ...partialMockAsset(),
          version: '1.0.0',
          product,
        },
        {
          ...partialMockAsset(),
          version: '1.0.0',
          product,
        },
        {
          ...partialMockAsset(),
          product,
        }
      ];
      const created = await Promise.all(assets.map(asset => Asset.create(asset).save()));
      const result = await new AssetResolver().assets({ version: '1.0.0' });
      delete created[0].product; // @TODO
      delete created[1].product;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries assets by clearance', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const assets = [
        {
          ...partialMockAsset(),
          clearance: AssetClearance.PROTECTED,
          product,
        },
        {
          ...partialMockAsset(),
          clearance: AssetClearance.PROTECTED,
          product,
        },
        {
          ...partialMockAsset(),
          clearance: AssetClearance.PRIVATE,
          product,
        }
      ];
      const created = await Promise.all(assets.map(asset => Asset.create(asset).save()));
      const result = await new AssetResolver().assets({ clearance: AssetClearance.PROTECTED });
      delete created[0].product; // @TODO
      delete created[1].product;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries assets by location', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const assets = [
        {
          ...partialMockAsset(),
          location: AssetLocation.GCLOUDSTORAGE,
          product,
        },
        {
          ...partialMockAsset(),
          location: AssetLocation.GCLOUDSTORAGE,
          product,
        },
        {
          ...partialMockAsset(),
          location: AssetLocation.INTERNAL,
          product,
        }
      ];
      const created = await Promise.all(assets.map(asset => Asset.create(asset).save()));
      const result = await new AssetResolver().assets({ location: AssetLocation.GCLOUDSTORAGE });
      delete created[0].product; // @TODO
      delete created[1].product;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });
  });

  describe('@FieldResolver product', () => {
    it('resolves the connected product', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const asset = await Asset.create({ ...partialMockAsset(), product }).save();
      const rootQuery = await new AssetResolver().asset(asset.id);
      const result = await new AssetResolver().product(rootQuery!);
      expect(product).toEqual(expect.objectContaining(result!));
    });
  });
});
