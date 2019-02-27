import { Product } from '../ProductEntity';
import { ProductResolver } from '../ProductResolver';
import { ProductCategory } from '../ProductCategory';
import { User } from '#/domains/User/UserEntity';
import { Permission } from '#/domains/User/Permission';
import { partialMockUser, partialMockProduct } from '#dev/test-utils/helpers';
import { ProductStatus } from '../ProductStatus';

describe('ProductResolver', () => {
  describe('@Mutation createProduct', () => {
    it('requires the CREATEPRODUCT permission', async () => {
      const user = await User.create(partialMockUser()).save();
      const input = { ...partialMockProduct(), userId: user.id };
      const ctx: any = {};
      await expect(new ProductResolver().createProduct(input, ctx)).rejects.toThrowError();
    });
  
    it('throws an error if a user is not found', async () => {
      const input= { ...partialMockProduct(), userId: '1234' };
      const ctx: any = {};
      await expect(new ProductResolver().createProduct(input, ctx)).rejects.toThrowError();
    });
  
    it('creates a product', async () => {
      const userInput = { ...partialMockUser(), permissions: [Permission.CREATEPRODUCT] };
      const user = await User.create(userInput).save();
      const product = {
        ...partialMockProduct(),
        maxRegistrationsPerOrder: 2,
        categories: [ProductCategory.PLUGIN],
      };
      const input = { ...product, userId: user.id };
      const ctx: any = {};
      const result = await new ProductResolver().createProduct(input, ctx);
      expect(result).toMatchObject(product);
    });
  
    it('creates a product with the user id from the current session', async () => {
      const userInput = { ...partialMockUser(), permissions: [Permission.CREATEPRODUCT] };
      const user = await User.create(userInput).save();
      const product = partialMockProduct();
      const ctx: any = { session: { userId: user.id } };
      const result = await new ProductResolver().createProduct(product, ctx);
      expect(result).toMatchObject(product);
      expect(result.user.id).toEqual(user.id);
    });
  
    it('throws an error if the given price is lower than 0', async () => {
      const product = { ...partialMockProduct(), price: -1 };
      const ctx: any = {};
      await expect(new ProductResolver().createProduct(product, ctx)).rejects.toThrowError();
    });
  
    it('throws an error if the given maxRegistrationsPerOrder is lower than 1', async () => {
      const product = { ...partialMockProduct(), maxRegistrationsPerOrder: 0 };
      const ctx: any = {};
      await expect(new ProductResolver().createProduct(product, ctx)).rejects.toThrowError();
    });
  });

  describe('@Query product', () => {
    it('queries a product by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const productInput = { ...partialMockProduct(), user };
      const product = await Product.create(productInput).save();
      const result = await new ProductResolver().product({ id: product.id });
      expect(product).toMatchObject(result!);
    });
  
    it('queries a product by name', async () => {
      const user = await User.create(partialMockUser()).save();
      const productInput = { ...partialMockProduct(), user };
      const product = await Product.create(productInput).save();
      const result = await new ProductResolver().product({ name: product.name });
      expect(product).toMatchObject(result!);
    });
  
    it('returns undefined if a product is not found', async () => {
      const result = await new ProductResolver().product({ id: '1234' });
      expect(result).toBeUndefined();
    });
  });

  describe('@Query products', () => {
    it('returns a paginated response', async () => {
      const result = await new ProductResolver().products();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });

    it('queries all products', async () => {
      await Promise.all(Array(5).fill(null).map(() => Product.create(partialMockProduct()).save()));
      const result = await new ProductResolver().products();
      expect(result!.total).toBe(5);
    });

    it('returns an empty array if no products are found', async () => {
      const result = await new ProductResolver().products();
      expect(Array.isArray(result!.data)).toBe(true);
      expect(result!.data.length).toBe(0);
    });

    it('queries products by status', async () => {
      const products = [
        {
          ...partialMockProduct(),
          status: ProductStatus.DISCONTINUED,
        },
        {
          ...partialMockProduct(),
          status: ProductStatus.DISCONTINUED,
        },
        partialMockProduct(),
        partialMockProduct(),
      ];
      await Promise.all(products.map(prod => Product.create(prod).save()));
      const result = await new ProductResolver().products({ status: ProductStatus.DISCONTINUED });
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(products[0]),
        expect.objectContaining(products[1]),
      ]));
    });

    it('queries products by maxRegistrationsPerOrder', async () => {
      const products = [
        {
          ...partialMockProduct(),
          maxRegistrationsPerOrder: 2,
        },
        {
          ...partialMockProduct(),
          maxRegistrationsPerOrder: 2,
        },
        partialMockProduct(),
        partialMockProduct(),
      ];
      await Promise.all(products.map(prod => Product.create(prod).save()));
      const result = await new ProductResolver().products({ maxRegistrationsPerOrder: 2 });
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(products[0]),
        expect.objectContaining(products[1]),
      ]));
    });

    it('queries products within the given categories', async () => {
      const products = [
        {
          ...partialMockProduct(),
          categories: [ProductCategory.PLUGIN],
        },
        {
          ...partialMockProduct(),
          categories: [ProductCategory.THEME],
        },
      ];
      await Promise.all(products.map(prod => Product.create(prod).save()));
      const result = await new ProductResolver().products({ categoryIn: [ProductCategory.PLUGIN] });
      expect(result!.data[0]).toEqual(expect.objectContaining(products[0]));
    });

    it('queries products without the given categories', async () => {
      const products = [
        {
          ...partialMockProduct(),
          categories: [ProductCategory.PLUGIN],
        },
        {
          ...partialMockProduct(),
          categories: [ProductCategory.THEME],
        },
      ];
      await Promise.all(products.map(prod => Product.create(prod).save()));
      const result = await new ProductResolver().products({ categoryNotIn: [ProductCategory.PLUGIN] });
      expect(result!.data[0]).toEqual(expect.objectContaining(products[1]));
    });
  });

  describe('@FieldResolver user', () => {
    it('resolves the connected user', async () => {
      const user = await User.create(partialMockUser()).save();
      const productInput = { ...partialMockProduct(), user };
      const product = await Product.create(productInput).save();
      const rootQuery = await new ProductResolver().product({ id: product.id });
      const result = await new ProductResolver().user(rootQuery!);
      expect(result).toMatchObject(user);
    });
  });

  // describe('@FieldResolver assets', () => {
  //   it('resolves assets connected to a product', async () => {
      
  //   });
  // });

  // describe('@FieldResolver registrations', () => {
  //   it('resolves registrations connected to a product', async () => {
      
  //   });
  // });
});
