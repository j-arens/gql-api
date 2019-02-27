import { PaymentResolver } from '../PaymentResolver';
import { User } from '#/domains/User/UserEntity';
import { Product } from '#/domains/Product/ProductEntity';
import { Order } from '#/domains/Order/OrderEntity';
import { partialMockUser, partialMockProduct } from '#dev/test-utils/helpers';
import { Payment } from '../PaymentEntity';
import { PaymentStatus } from '../PaymentStatus';
import braintree from '#dev/test-utils/mocks/braintree';

describe('PaymentResolver', () => {
  describe('@Mutation createPayment', () => {
    it('throws an error if a user is not found', async () => {
      const ctx: any = { session: { userId: '1234' } };
      const input = { orderId: '1234', nonce: '1', expectedAmount: 1 };
      await expect(new PaymentResolver().createPayment(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if an order is not found', async () => {
      const user = await User.create(partialMockUser()).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: '1234', nonce: '1', expectedAmount: 1 };
      await expect(new PaymentResolver().createPayment(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if the expectedAmount does not match the order total', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: order.id, nonce: '1', expectedAmount: 1 };
      await expect(new PaymentResolver().createPayment(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if there is already a paid payment', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      await Payment.create({ user, order, transactionId: '1', amount: 400, status: PaymentStatus.PAID }).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: order.id, nonce: '1', expectedAmount: 400 };
      await expect(new PaymentResolver().createPayment(input, ctx)).rejects.toThrowError();
    });

    it('throws an error if there is already a processing payment', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      await Payment.create({ user, order, transactionId: '1', amount: 400, status: PaymentStatus.PROCESSING }).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: order.id, nonce: '1', expectedAmount: 400 };
      await expect(new PaymentResolver().createPayment(input, ctx)).rejects.toThrowError();
    });

    it('creates a declined payment record if the transaction fails', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: order.id, nonce: '1', expectedAmount: 400 };
      const resolver = new PaymentResolver();
      braintree.gateway.transaction.sale = jest.fn(() => Promise.resolve({ success: false }));
      resolver.braintree = braintree;
      await expect(resolver.createPayment(input, ctx)).rejects.toThrowError();
      const payment = await Payment.findOne({ where: { user } });
      expect(payment!.status).toBe(PaymentStatus.DECLINED);
    });

    it('creates a successfull payment', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      const ctx: any = { session: { userId: user.id } };
      const input = { orderId: order.id, nonce: '1', expectedAmount: 400 };
      const resolver = new PaymentResolver();
      braintree.gateway.transaction.sale = jest.fn(() => Promise.resolve({ success: true }));
      resolver.braintree = braintree;
      const result = await resolver.createPayment(input, ctx);
      expect(result.status).toBe(PaymentStatus.PAID);
    });
  });

  // @TODO!
  // describe('@Mutation createPaymentToken', () => {
  //   it('gets a payment token', async () => {

  //   });
  // });

  describe('@Query payment', () => {
    it('queries a payment by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      const payment = await Payment.create({
        user,
        order,
        transactionId: '1',
        amount: 400,
        status: PaymentStatus.PAID,
      }).save();
      const result = await new PaymentResolver().payment({ id: payment.id });
      expect(payment).toEqual(expect.objectContaining(result!));
    });

    it('queries a payment by transaction id', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      const payment = await Payment.create({
        user,
        order,
        transactionId: '1',
        amount: 400,
        status: PaymentStatus.PAID,
      }).save();
      const result = await new PaymentResolver().payment({ transactionId: '1' });
      expect(payment).toEqual(expect.objectContaining(result!));
    });

    it('returns undefined if a payment is not found', async () => {
      const result = await new PaymentResolver().payment({ id: '1234' });
      expect(result).toBeUndefined();
    });
  });

  describe('@Query payments', () => {
    it('returns a paginated response', async () => {
      const result = await new PaymentResolver().payments();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });

    it('queries all payments', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = await Promise.all(Array(5).fill(null).map(() => Order.create({
        user,
        products: [prod],
        tax: 0,
        total: 400,
      }).save()));
      await Promise.all(Array(5).fill(null).map((_, i) => Payment.create({
        user,
        order: orders[i],
        transactionId: i.toString(),
        amount: 400,
        status: PaymentStatus.PAID,
      }).save()));
      const result = await new PaymentResolver().payments();
      expect(result!.total).toBe(5);
    });

    it('queries payments by userId', async () => {
      const user1 = await User.create(partialMockUser()).save();
      const user2 = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user: user1 }).save();
      const orders = [
        {
          user: user1,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user: user1,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user: user2,
          products: [prod],
          tax: 0,
          total: 100,
        },
      ];
      const createdOrders = await Promise.all(orders.map(
        async order => await Order.create(order).save())
      );
      const payments = [
        {
          user: user1,
          order: createdOrders[0],
          transactionId: '1',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user: user1,
          order: createdOrders[1],
          transactionId: '2',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user: user2,
          order: createdOrders[2],
          transactionId: '3',
          amount: 100,
          status: PaymentStatus.PAID,
        },
      ];
      const createdPayments = await Promise.all(payments.map(
        async payment => await Payment.create(payment).save())
      );
      const result = await new PaymentResolver().payments({ userId: user1.id });
      expect(result.total).toBe(2);
      expect(createdPayments[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '1'))
      );
      expect(createdPayments[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '2'))
      );
    });

    it('queries payments by amountEqualTo', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 300,
        },
      ];
      const createdOrders = await Promise.all(orders.map(
        async order => await Order.create(order).save())
      );
      const payments = [
        {
          user,
          order: createdOrders[0],
          transactionId: '1',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[1],
          transactionId: '2',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[2],
          transactionId: '3',
          amount: 300,
          status: PaymentStatus.PAID,
        },
      ];
      const createdPayments = await Promise.all(payments.map(
        async payment => await Payment.create(payment).save())
      );
      const result = await new PaymentResolver().payments({ amountEqualTo: 100 });
      expect(result.total).toBe(2);
      expect(createdPayments[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '1'))
      );
      expect(createdPayments[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '2'))
      );
    });

    it('queries payments by amountGreaterThan', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 50,
        },
      ];
      const createdOrders = await Promise.all(orders.map(
        async order => await Order.create(order).save())
      );
      const payments = [
        {
          user,
          order: createdOrders[0],
          transactionId: '1',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[1],
          transactionId: '2',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[2],
          transactionId: '3',
          amount: 50,
          status: PaymentStatus.PAID,
        },
      ];
      const createdPayments = await Promise.all(payments.map(
        async payment => await Payment.create(payment).save())
      );
      const result = await new PaymentResolver().payments({ amountGreaterThan: 90 });
      expect(result.total).toBe(2);
      expect(createdPayments[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '1'))
      );
      expect(createdPayments[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '2'))
      );
    });

    it('queries payments by amountLessThan', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 200,
        },
      ];
      const createdOrders = await Promise.all(orders.map(
        async order => await Order.create(order).save())
      );
      const payments = [
        {
          user,
          order: createdOrders[0],
          transactionId: '1',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[1],
          transactionId: '2',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[2],
          transactionId: '3',
          amount: 200,
          status: PaymentStatus.PAID,
        },
      ];
      const createdPayments = await Promise.all(payments.map(
        async payment => await Payment.create(payment).save())
      );
      const result = await new PaymentResolver().payments({ amountLessThan: 150 });
      expect(result.total).toBe(2);
      expect(createdPayments[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '1'))
      );
      expect(createdPayments[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '2'))
      );
    });

    it('queries payments by status', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const orders = [
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 100,
        },
        {
          user,
          products: [prod],
          tax: 0,
          total: 200,
        },
      ];
      const createdOrders = await Promise.all(orders.map(
        async order => await Order.create(order).save())
      );
      const payments = [
        {
          user,
          order: createdOrders[0],
          transactionId: '1',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[1],
          transactionId: '2',
          amount: 100,
          status: PaymentStatus.PAID,
        },
        {
          user,
          order: createdOrders[2],
          transactionId: '3',
          amount: 200,
          status: PaymentStatus.DECLINED,
        },
      ];
      const createdPayments = await Promise.all(payments.map(
        async payment => await Payment.create(payment).save())
      );
      const result = await new PaymentResolver().payments({ status: PaymentStatus.PAID });
      expect(result.total).toBe(2);
      expect(createdPayments[0]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '1'))
      );
      expect(createdPayments[1]).toEqual(
        // @ts-ignore
        expect.objectContaining(result.data.find(r => r.transactionId === '2'))
      );
    });
  });

  describe('@FieldResolver user', () => {
    it('resolves the connected user', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      await Payment.create({
        user,
        order,
        transactionId: '1',
        amount: 400,
        status: PaymentStatus.PAID,
      }).save();
      const rootQuery = await new PaymentResolver().payment({ transactionId: '1' });
      const result = await new PaymentResolver().user(rootQuery!);
      expect(user).toEqual(expect.objectContaining(result!));
    });
  });

  describe('@FieldResolver order', () => {
    it('resolves the connected order', async () => {
      const user = await User.create(partialMockUser()).save();
      const prod = await Product.create({ ...partialMockProduct(), user }).save();
      const order = await Order.create({ user, products: [prod], tax: 0, total: 400 }).save();
      await Payment.create({
        user,
        order,
        transactionId: '1',
        amount: 400,
        status: PaymentStatus.PAID,
      }).save();
      const rootQuery = await new PaymentResolver().payment({ transactionId: '1' });
      const result = await new PaymentResolver().order(rootQuery!);
      expect(order).toEqual(expect.objectContaining(result!));
    });
  });
});
