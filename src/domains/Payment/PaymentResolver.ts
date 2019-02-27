import { Resolver, Mutation, Arg, Ctx, Query, FieldResolver, Root } from 'type-graphql';
import { Raw } from 'typeorm';
import { Inject } from 'typedi';
import { ApolloError, UserInputError } from 'apollo-server-koa';
import { Payment } from './PaymentEntity';
import { CreatePaymentInput } from './inputs/CreatePaymentInput';
import { PaymentWhereUniqueInput } from './inputs/PaymentWhereUniqueInput';
import { PaymentsWhereInput } from './inputs/PaymentsWhereInput';
import { PaymentStatus } from './PaymentStatus';
import { PaymentToken } from './PaymentToken';
import { User } from '#/domains/User/UserEntity';
import { Order } from '#/domains/Order/OrderEntity';
import { paginatedResponseType, paginate } from '#/data/pagination/';
import { PaginatedResponse } from '#/data/pagination/type';
import { prepareQuery } from '#/data/utils/';
import * as App from '#/app/type';

const PaginatedPayments = paginatedResponseType(Payment);

@Resolver(() => Payment)
export class PaymentResolver {
  @Inject('braintree')
  braintree: any; // @TODO type

  // @TODO: break up into smaller chunks?
  @Mutation(() => Payment)
  async createPayment(
    @Arg('data') data: CreatePaymentInput,
    @Ctx() { session }: App.Ctx,
  ): Promise<Payment> {
    const { orderId, nonce, expectedAmount } = data;
    const user = await User.findOne(session.userId);

    // @TODO: is this needed if using permissions middleware?
    if (!user) {
      throw new ApolloError('could not find user');
    }

    const order = await Order.findOne({
      where: {
        id: orderId,
        userId: user.id,
      },
    });

    if (!order) {
      throw new UserInputError('could not find order');
    }

    if (order.total !== expectedAmount) {
      throw new UserInputError('order total and charge amount do not match');
    }

    // check for existing successfull/processing payment
    const existing = await Payment.count({
      where: {
        orderId,
        userId: user.id,
        status: Raw(
          `'${PaymentStatus.PAID}' OR \`Payment\`.\`status\` = '${PaymentStatus.PROCESSING}'`
        ),
      },
    });
    if (existing) {
      throw new ApolloError('payment already exists');
    }

    const { braintree: { gateway: { transaction } } } = this;
    const result = await transaction.sale({
      amount: order.total,
      paymentMethodNonce: nonce,
      options: {
        submitForSettlement: true, // @TODO???
      },
    });

    // @TODO: get transaction id from payment?
    const transactionId = String(Math.random() * 1000);

    if (!result.success) {
      // @TODO: log
      // const errors = result.errors.deepErrors() > 0 ? result.errors : []; // @TODO?
      // if no errors check:
      // resukt.transaction.status === 'processor_declined';
      // paymentStatus = PaymentStatus.DECLINED
      // result.transaction.processorSettlementResponseCode
      // result.transaction.processorSettlementResponseText e.g. 'insuffcient funds'

      await Payment.create({
        transactionId,
        user,
        order,
        amount: order.total,
        status: PaymentStatus.DECLINED,
      }).save();

      throw new ApolloError('transaction failed');
    }

    return Payment.create({
      transactionId,
      user,
      order,
      amount: order.total,
      status: PaymentStatus.PAID,
    }).save();
  }

  @Mutation(() => PaymentToken)
  createPaymentToken(): PaymentToken {
    // @TODO: braintree stuff
    return new PaymentToken(String(Math.random() * 1000));
  }

  @Query(() => Payment, { nullable: true })
  payment(
    @Arg('where') where: PaymentWhereUniqueInput,
  ): Promise<Payment | undefined> {
    const { id, transactionId } = where;
    if (id) {
      return Payment.findOne(id);
    }
    return Payment.findOne({ where: { transactionId } });
  }

  @Query(() => PaginatedPayments)
  payments(
    @Arg('where', { nullable: true }) where: PaymentsWhereInput = {},
  ): Promise<PaginatedResponse<Payment>> {
    const qb = Payment
      .getRepository()
      .createQueryBuilder('p');

    const prepared = prepareQuery<Payment>(where, {
      userId: (q, uid) => q.andWhere('p.userId = :uid', { uid }),
      amountEqualTo: (q, et) => q.andWhere('p.amount = :et', { et }),
      amountGreaterThan: (q, gt) => q.andWhere('p.amount > :gt', { gt }),
      amountLessThan: (q, lt) => q.andWhere('p.amount < :lt', { lt }),
      status: (q, status) => q.andWhere('p.status = :status', { status }),
    });

    return paginate<Payment>({
      type: 'Payment',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver()
  user(
    @Root() { id }: Payment,
  ): Promise<User | undefined> {
    return User
      .getRepository()
      .createQueryBuilder('u')
      .leftJoinAndSelect(Payment, 'p', 'p.id = :id', { id })
      .getOne();
  }

  @FieldResolver()
  order(
    @Root() { id }: Payment,
  ): Promise<Order | undefined> {
    return Order
      .getRepository()
      .createQueryBuilder('o')
      .leftJoinAndSelect(Payment, 'p', 'p.id = :id', { id })
      .getOne();
  }
}
