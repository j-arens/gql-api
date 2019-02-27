import { RegistrationResolver } from '../RegistrationResolver';
import { User } from '#/domains/User/UserEntity';
import { partialMockUser, partialMockProduct } from '#dev/test-utils/helpers';
import { Product } from '#/domains/Product/ProductEntity';
import { Order } from '#/domains/Order/OrderEntity';
import { Registration } from '../RegistrationEntity';

describe('RegistrationResolver', () => {
  describe('@Mutation createRegistration', () => {
    it('throws an error if a user is not found', async () => {
      const input = { userId: '1234', productId: '1', orderId: '2' };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      await expect(new RegistrationResolver().createRegistration(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if a product is not found', async () => {
      const user = await User.create(partialMockUser()).save();
      const input = { userId: user.id, productId: '1', orderId: '2' };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      await expect(new RegistrationResolver().createRegistration(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if a order is not found', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({ ...partialMockProduct(), user }).save();
      const input = { userId: user.id, productId: product.id, orderId: '2' };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      await expect(new RegistrationResolver().createRegistration(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if a registration has already been created for the requesting domain', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 2,
      }).save();
      const order = await Order.create({ user, products: [product], tax: 0, total: 1 }).save();
      await Registration.create({ user, product, order, domain: 'lol.com' }).save();
      const input = { userId: user.id, productId: product.id, orderId: order.id };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      await expect(new RegistrationResolver().createRegistration(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if the max amount of registrations allowed has been reached', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({ user, products: [product], tax: 0, total: 1 }).save();
      await Registration.create({ user, product, order, domain: 'http://rofl.com' }).save();
      const input = { userId: user.id, productId: product.id, orderId: order.id };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      await expect(new RegistrationResolver().createRegistration(input, ctx)).rejects.toThrowError();
    });

    it('creates a registration', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({ user, products: [product], tax: 0, total: 1 }).save();
      const input = { userId: user.id, productId: product.id, orderId: order.id };
      const ctx: any = { request: { headers: { origin: 'http://lol.com' } } };
      const result = await new RegistrationResolver().createRegistration(input, ctx);
      expect(result).toEqual(expect.objectContaining({
        id: expect.any(String),
        domain: 'lol.com',
        user: expect.any(Object),
        product: expect.any(Object),
        order: expect.any(Object),
      }));
    });
  });

  describe('@Query registration', () => {
    it('queries a registration by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({ user, products: [product], tax: 0, total: 1 }).save();
      const reg = await Registration.create({ user, product, order, domain: 'lol.com' }).save();
      const result = await new RegistrationResolver().registration(reg.id);
      expect(reg).toMatchObject(result!);
    });

    it('returns undefined if a registration is not found', async () => {
      const result = await new RegistrationResolver().registration('1234');
      expect(result).toBeUndefined();
    });
  });

  describe('@Query registrations', () => {
    it('returns a paginated response', async () => {
      const result = await new RegistrationResolver().registrations();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });

    it('queries all registrations', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({ user, products: [product], tax: 0, total: 1 }).save();
      await Promise.all(Array(5).fill(null).map(() => Registration.create({
        user,
        product,
        order,
        domain: 'lol.com',
      }).save()));
      const result = await new RegistrationResolver().registrations();
      expect(result!.total).toBe(5);
    });

    it('queries registrations by userId', async () => {
      const user1 = await User.create(partialMockUser()).save();
      const user2 = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user: user1,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user: user1,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const regs = [
        {
          product,
          user: user1,
          order,
          domain: 'lol.com',
        },
        {
          product,
          user: user1,
          order,
          domain: 'rofl.com',
        },
        {
          product,
          user: user2,
          order,
          domain: 'lol.com',
        },
      ];
      const createdRegs = await Promise.all(
        regs.map(async reg => await Registration.create(reg).save())
      );
      const result = await new RegistrationResolver().registrations({ userId: user1.id });
      expect(result.total).toBe(2);
      expect(createdRegs[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'lol.com'))
      );
      expect(createdRegs[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'rofl.com'))
      );
    });

    it('queries registrations by productId', async () => {
      const user = await User.create(partialMockUser()).save();
      const product1 = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const product2 = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user,
        products: [product1, product2],
        tax: 0,
        total: 1,
      }).save();
      const regs = [
        {
          product: product1,
          user,
          order,
          domain: 'lol.com',
        },
        {
          product: product1,
          user,
          order,
          domain: 'rofl.com',
        },
        {
          product: product2,
          user,
          order,
          domain: 'lol.com',
        },
      ];
      const createdRegs = await Promise.all(
        regs.map(async reg => await Registration.create(reg).save())
      );
      const result = await new RegistrationResolver().registrations({ productId: product1.id });
      expect(result.total).toBe(2);
      expect(createdRegs[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'lol.com'))
      );
      expect(createdRegs[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'rofl.com'))
      );
    });

    it('queries registrations by orderId', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order1 = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const order2 = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const regs = [
        {
          product,
          user,
          order: order1,
          domain: 'lol.com',
        },
        {
          product,
          user,
          order: order1,
          domain: 'rofl.com',
        },
        {
          product,
          user,
          order: order2,
          domain: 'lol.com',
        },
      ];
      const createdRegs = await Promise.all(
        regs.map(async reg => await Registration.create(reg).save())
      );
      const result = await new RegistrationResolver().registrations({ orderId: order1.id });
      expect(result.total).toBe(2);
      expect(createdRegs[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'lol.com'))
      );
      expect(createdRegs[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.domain === 'rofl.com'))
      );
    });

    it('queries registrations by domain', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const regs = [
        {
          product,
          user,
          order,
          domain: 'lol.com',
        },
        {
          product,
          user,
          order,
          domain: 'lol.com',
        },
        {
          product,
          user,
          order,
          domain: 'rofl.com',
        },
      ];
      await Promise.all(
        regs.map(async reg => await Registration.create(reg).save())
      );
      const result = await new RegistrationResolver().registrations({ domain: 'lol.com' });
      expect(result.total).toBe(2);
      expect(result.data[0].domain).toEqual('lol.com');
      expect(result.data[1].domain).toEqual('lol.com');
    });
  });

  describe('@FieldResolver user', () => {
    it('resolves the connected user', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const reg = await Registration.create({ user, product, order, domain: 'lol.com' }).save();
      const rootQuery = await new RegistrationResolver().registration(reg.id);
      const result = await new RegistrationResolver().user(rootQuery!);
      expect(user).toEqual(expect.objectContaining(result!));
    });
  });

  describe('@FieldResolver product', () => {
    it('resolves the connected product', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const reg = await Registration.create({ user, product, order, domain: 'lol.com' }).save();
      const rootQuery = await new RegistrationResolver().registration(reg.id);
      const result = await new RegistrationResolver().product(rootQuery!);
      expect(product).toEqual(expect.objectContaining(result!));
    });
  });

  describe('@FieldResolver order', () => {
    it('resolves the connected order', async () => {
      const user = await User.create(partialMockUser()).save();
      const product = await Product.create({
        ...partialMockProduct(),
        user,
        maxRegistrationsPerOrder: 1,
      }).save();
      const order = await Order.create({
        user,
        products: [product],
        tax: 0,
        total: 1,
      }).save();
      const reg = await Registration.create({ user, product, order, domain: 'lol.com' }).save();
      const rootQuery = await new RegistrationResolver().registration(reg.id);
      const result = await new RegistrationResolver().order(rootQuery!);
      expect(order).toEqual(expect.objectContaining(result!));
    });
  });
});
