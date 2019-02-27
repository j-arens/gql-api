import { Resolver, Mutation, Arg, Ctx, Query, FieldResolver, Root } from 'type-graphql';
import { Order } from './OrderEntity';
import { User } from '#/domains/User/UserEntity';
import { Product } from '#/domains/Product/ProductEntity';
import { ProductStatus } from '#/domains/Product/ProductStatus';
import { UserInputError } from 'apollo-server-koa';
import { paginatedResponseType, paginate } from '#/data/pagination/';
import { PaginatedResponse } from '#/data/pagination/type';
import { OrdersWhereInput } from './inputs/OrdersWhereInput';
import { prepareQuery } from '#/data/utils/';
import * as App from '#/app/type';

const PaginatedOrders = paginatedResponseType(Order);

@Resolver(() => Order)
export class OrderResolver {
  @Mutation(() => Order)
  async createOrder(
    @Arg('productIds', () => [String]) productIds: string[],
    @Ctx() { session }: App.Ctx,
  ): Promise<Order> {
    const user = await User.findOne(session.userId);
    if (!user) {
      throw new UserInputError('could not find user');
    }

    const products = await Product.find({
      where: productIds.map(id => ({ id })),
    });

    if (products.length !== productIds.length) {
      throw new UserInputError('could not find products');
    }
    
    const discontinued = products.some(product => product.status === ProductStatus.DISCONTINUED);
    if (discontinued) {
      throw new UserInputError('cannot create order for discontinued product');
    }

    const tax = 0; // @TODO
    // apply promos???
    const total = products.reduce((acc, product) => product.price + acc, 0) + tax;

    return Order.create({
      user,
      products,
      tax,
      total,
    }).save();
  }

  @Query(() => Order, { nullable: true })
  order(
    @Arg('id') id: string,
  ): Promise<Order | undefined> {
    return Order.findOne({ where: { id } });
  }

  @Query(() => PaginatedOrders)
  orders(
    @Arg('where', { nullable: true }) where: OrdersWhereInput = {},
  ): Promise<PaginatedResponse<Order>> {
    const qb = Order
      .getRepository()
      .createQueryBuilder('o');

    const prepared = prepareQuery<Order>(where, {
      userId: (q, uid) => q.andWhere('o.userId = :uid', { uid }),
      totalGreaterThan: (q, gt) => q.andWhere('o.total > :gt', { gt }),
      totalLessThan: (q, lt) => q.andWhere('o.total < :lt', { lt }),
      totalEqualTo: (q, et) => q.andWhere('o.total = :et', { et }),
      productId: (q, pid) => q.leftJoinAndSelect('ordersToProducts', 'o2p', 'o2p.productId = :pid', { pid }),
    });

    return paginate<Order>({
      type: 'Order',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver(() => [Product])
  products(
    @Root() { id }: Order,
  ): Promise<Product[]> {
    return Product
      .getRepository()
      .createQueryBuilder('p')
      .leftJoinAndSelect('ordersToProducts', 'o2p', 'o2p.orderId = :id', { id })
      .getMany();
  }

  @FieldResolver(() => [User])
  user(
    @Root() { id }: Order,
  ): Promise<User | undefined> {
    return User
      .getRepository()
      .createQueryBuilder('u')
      .leftJoinAndSelect(Order, 'o', 'o.id = :id', { id })
      .getOne();
  }
}
