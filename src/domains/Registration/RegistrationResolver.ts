import { Resolver, Mutation, Arg, Ctx, Query, FieldResolver, Root } from 'type-graphql';
import { Registration } from './RegistrationEntity';
import { CreateRegistrationInput } from './inputs/CreateRegistrationInput';
import { RegistrationsWhereInput } from './inputs/RegistrationsWhereInput';
import { User } from '#/domains/User/UserEntity';
import { Product } from '#/domains/Product/ProductEntity';
import { Order } from '#/domains/Order/OrderEntity';
import { UserInputError, ApolloError } from 'apollo-server-koa';
import { paginatedResponseType, paginate } from '#/data/pagination/';
import { PaginatedResponse } from '#/data/pagination/type';
import { prepareQuery } from '#/data/utils/';
import * as App from '#/app/type';

const PaginatedRegistrations = paginatedResponseType(Registration);

@Resolver(() => Registration)
export class RegistrationResolver {
  @Mutation(() => Registration)
  async createRegistration(
    @Arg('data') data: CreateRegistrationInput,
    @Ctx() { request }: App.Ctx,
  ): Promise<Registration> {
    // get userId from session instead of passing directly?
    const { userId, productId, orderId } = data;
    const domain = request.headers.origin.replace(/^(http|https):\/\//, '');
    const user = await User.findOne(userId);
    const product = await Product.findOne(productId);
    const order = await Order.findOne(orderId);

    if (!user) {
      throw new UserInputError('invalid user id');
    }

    if (!product) {
      throw new UserInputError('invalid product id');
    }

    if (!order) {
      throw new UserInputError('invalid order id');
    }

    const { maxRegistrationsPerOrder } = product;
    const existing = await Registration.find({
      where: {
        userId,
        productId,
        orderId,
      },
    });

    // check if already registered at the given domain
    if (existing.length) {
      const matches = existing.filter(reg => reg.domain === domain);
      if (matches.length) {
        throw new ApolloError('already registered at this domain');
      }
    }

    if (maxRegistrationsPerOrder === 0 || (existing.length >= maxRegistrationsPerOrder)) {
      // set response status?
      throw new ApolloError('max registrations exceeded');
    }

    return Registration.create({
      domain,
      user,
      product,
      order,
    }).save();
  }

  @Query(() => Registration, { nullable: true })
  registration(
    @Arg('id') id: string,
  ): Promise<Registration | undefined> {
    return Registration.findOne(id);
  }

  @Query(() => PaginatedRegistrations)
  registrations(
    @Arg('where', { nullable: true }) where: RegistrationsWhereInput = {},
  ): Promise<PaginatedResponse<Registration>> {
    const qb = Registration
      .getRepository()
      .createQueryBuilder('r');

    const prepared = prepareQuery<Registration>(where, {
      userId: (q, uid) => q.andWhere('r.userId = :uid', { uid }),
      productId: (q, pid) => q.andWhere('r.productId = :pid', { pid }),
      orderId: (q, oid) => q.andWhere('r.orderId = :oid', { oid }),
      domain: (q, domain) => q.andWhere('r.domain = :domain', { domain }),
    });

    return paginate<Registration>({
      type: 'Registration',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver()
  user(
    @Root() { id }: Registration
  ): Promise<User | undefined> {
    return User
      .getRepository()
      .createQueryBuilder('u')
      .leftJoinAndSelect(Registration, 'r', 'r.id = :id', { id })
      .getOne();
  }

  @FieldResolver()
  product(
    @Root() { id }: Registration
  ): Promise<Product | undefined> {
    return Product
      .getRepository()
      .createQueryBuilder('p')
      .leftJoinAndSelect(Registration, 'r', 'r.id = :id', { id })
      .getOne();
  }

  @FieldResolver()
  order(
    @Root() { id }: Registration
  ): Promise<Order | undefined> {
    return Order
      .getRepository()
      .createQueryBuilder('o')
      .leftJoinAndSelect(Registration, 'r', 'r.id = :id', { id })
      .getOne();
  }
}
