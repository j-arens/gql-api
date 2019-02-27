import { OrderResolver } from '../OrderResolver';
import { Order } from '../OrderEntity';
import { User } from '#/domains/User/UserEntity';
import { partialMockUser, partialMockProduct } from '#dev/test-utils/helpers';
import { Product } from '#/domains/Product/ProductEntity';
import { ProductStatus } from '#/domains/Product/ProductStatus';

describe('OrderResolver', () => {
  describe('@Mutation createOrder', () => {
    it('throws an error if a user is not found', async () => {
      const ctx: any = { req: { session: { userId: '1234' } } };
      await expect(new OrderResolver().createOrder(
        ['1234'],
        ctx,
      )).rejects.toThrowError();
    });

    it('throws an error if any products are not found', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const ctx: any = { session: { userId: user.id } };
      await expect(new OrderResolver().createOrder(
        [prod.id, '1234'],
        ctx,
      )).rejects.toThrowError();
    });

    it('throws an error if any of the products are discontinued', async () => {
      const user = await User.create(partialMockUser()).save();
      const prodInput = { ...partialMockProduct(), user, status: ProductStatus.DISCONTINUED };
      const prod = await Product.create(prodInput).save();
      const ctx: any = { session: { userId: user.id } };
      await expect(new OrderResolver().createOrder(
        [prod.id],
        ctx,
      )).rejects.toThrowError();
    });

    it('creates an order', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod1 = await Product.create({ ...partialMockProduct(), user }).save();
      const prod2 = await Product.create({ ...partialMockProduct(), user }).save();
      const ctx: any = { session: { userId: user.id } };
      const result = await new OrderResolver().createOrder([prod1.id, prod2.id], ctx);
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        user: expect.any(Object),
        products: expect.any(Array),
        tax: expect.any(Number),
        total: expect.any(Number),
      }));
      expect(result.total).toEqual(prod1.price + prod2.price);
    });
  });

  describe('@Query order', () => {
    it('queries an order by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const ctx: any = { session: { userId: user.id } };
      const order = await new OrderResolver().createOrder([prod.id], ctx);
      const result = await new OrderResolver().order(order.id);
      expect(order).toMatchObject(result!);
    });

    it('returns undefined if an order is not found', async () => {
      const result = await new OrderResolver().order('1234');
      expect(result).toBeUndefined();
    });
  });

  describe('@Query orders', () => {
    it('returns a paginated response', async () => {
      const result = await new OrderResolver().orders();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });

    it('queries all orders', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const ctx: any = { session: { userId: user.id } };
      await Promise.all(Array(5).fill(null).map(() => new OrderResolver().createOrder([prod.id], ctx)));
      const result = await new OrderResolver().orders();
      expect(result!.total).toBe(5);
    });

    it('returns an empty array if no orders are found', async () => {
      const result = await new OrderResolver().orders();
      expect(Array.isArray(result!.data)).toBe(true);
      expect(result!.data.length).toBe(0);
    });

    it('queries orders by user id', async () => {
      const user1 = await User.create(partialMockUser()).save();
      const user2 = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user: user1 }).save();
      const orders = [
        {
          user: user1,
          tax: 0,
          total: prod.price,
          products: [prod],
        },
        {
          user: user1,
          tax: 0,
          total: prod.price,
          products: [prod],
        },
        {
          user: user2,
          tax: 0,
          total: prod.price,
          products: [prod],
        },
      ];
      const created = await Promise.all(orders.map(order => Order.create(order).save()));
      const result = await new OrderResolver().orders({ userId: user1.id });
      delete created[0].user; // @TODO
      delete created[1].user;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries orders by totalGreaterThan', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user: user,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 400,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 100,
          products: [prod],
        },
      ];
      const created = await Promise.all(orders.map(order => Order.create(order).save()));
      const result = await new OrderResolver().orders({ totalGreaterThan: 150 });
      delete created[0].user; // @TODO
      delete created[1].user;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries orders by totalLessThan', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user: user,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 400,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 1000,
          products: [prod],
        },
      ];
      const created = await Promise.all(orders.map(order => Order.create(order).save()));
      const result = await new OrderResolver().orders({ totalLessThan: 900 });
      delete created[0].user; // @TODO
      delete created[1].user;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries orders by totalEqualTo', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user: user,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user,
          tax: 0,
          total: 1000,
          products: [prod],
        },
      ];
      const created = await Promise.all(orders.map(order => Order.create(order).save()));
      const result = await new OrderResolver().orders({ totalEqualTo: 500 });
      delete created[0].user; // @TODO
      delete created[1].user;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });

    it('queries order by productId', async () => {
      const user1 = await User.create(partialMockUser()).save();
      const user2 = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user: user1 }).save();
      const orders = [
        {
          user: user1,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user1,
          tax: 0,
          total: 500,
          products: [prod],
        },
        {
          user: user2,
          tax: 0,
          total: 1000,
          products: [prod],
        },
      ];
      const created = await Promise.all(orders.map(order => Order.create(order).save()));
      const result = await new OrderResolver().orders({ totalEqualTo: 500 });
      delete created[0].user; // @TODO
      delete created[1].user;
      expect(result.total).toBe(2);
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(created[0]),
        expect.objectContaining(created[1]),
      ]));
    });
  });

  describe('@FieldResolver product', () => {
    it('resolves the connected products', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, tax: 0, total: 0, products: [prod] }).save();
      const rootQuery = await new OrderResolver().order(order.id);
      const result = await new OrderResolver().products(rootQuery!);
      expect(prod).toEqual(expect.objectContaining(result[0]));
    });
  });
});
