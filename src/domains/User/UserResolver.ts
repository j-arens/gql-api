import { Resolver, Mutation, Query, Arg, Root, FieldResolver, Ctx } from 'type-graphql';
import bcrypt from 'bcryptjs';
import { Order } from '../Order/OrderEntity';
import { Product } from '../Product/ProductEntity';
import { Payment } from '../Payment/PaymentEntity';
import { Registration } from '../Registration/RegistrationEntity';
import { User } from './UserEntity';
import { UserWhereUniqueInput } from './inputs/UserWhereUniqueInput';
import { UsersWhereInput } from './inputs/UsersWhereInput';
import { AuthenticateUserInput } from './inputs/AuthenticateUserInput';
import { paginate, paginatedResponseType } from '#/data/pagination';
import { PaginatedResponse } from '#/data/pagination/type';
import { Permission } from './Permission';
import { prepareQuery, searchSet } from '#/data/utils/';
import { CreateUserInput } from './inputs/CreateUserInput';
import { policy } from './passwordPolicy';
import { UserInputError, ApolloError } from 'apollo-server-koa';
import Session from './session/Session';
import * as App from '#/app/type';

const PaginatedUsers = paginatedResponseType(User);

@Resolver(() => User)
export class UserResolver {
  @Mutation(() => User)
  async createUser(
    @Arg('data') data: CreateUserInput,
  ): Promise<User> {
    const { email, password, permissions, verified } = data;

    if (password) {
      policy.assert(password); // @TODO: error message?
    }

    // @TODO: send email
    const user = await User.create({
      email: email.trim().toLowerCase(),
      password: password ? await bcrypt.hash(password, 10) : undefined,
      permissions,
      verified,
    }).save();

    // @TODO: session
    return user;
  }

  @Mutation(() => User, { nullable: true })
  async authenticate(
    @Arg('data') data: AuthenticateUserInput,
    @Ctx() ctx: App.Ctx,
  ): Promise<User | undefined> {
    const { email, password } = data;

    if (ctx.session.userId) {
      return User.findOne(ctx.session.userId);
    }

    // check for token??

    const user = await User.findOne({ where: { email } });
    if (!user) {
      throw new UserInputError('could not find user');
    }

    const verified = await bcrypt.compare(password, user.password);
    if (!verified) {
      throw new UserInputError('invalid credentials');
    }

    return user;
  }

  @Mutation(() => User, { nullable: true })
  async startSession(
    @Arg('data') data: AuthenticateUserInput,
    @Ctx() ctx: App.Ctx,
  ): Promise<User | undefined> {
    const user = await this.authenticate(data, ctx);

    if (!user) {
      throw new ApolloError('could not get user');
    }

    try {
      const session = new Session({ userId: user.id });
      await session.store();
      ctx.session = session;
    } catch (err) {
      throw new ApolloError('could not create session');
    }

    return user;
  }

  // @Mutation(() => User, { nullable: true })
  // async requestToken(
  //   @Arg('data') data: AuthenticateUserInput,
  //   @Ctx() ctx: any, // @TODO type
  // ): Promise<string | undefined> {

  // }

  @Query(() => User, { nullable: true })
  user(
    @Arg('where') where: UserWhereUniqueInput,
  ): Promise<User | undefined> {
    const { id, email } = where;
    if (id) {
      return User.findOne(id);
    }
    return User.findOne({ email });
  }

  @Query(() => PaginatedUsers)
  users(
    @Arg('where', { nullable: true }) where: UsersWhereInput = {},
  ): Promise<PaginatedResponse<User>> {
    const repo = User.getRepository();
    const qb = repo.createQueryBuilder('u');

    const prepared = prepareQuery<User>(where, {
      permissionIn: (...args) => searchSet<User, Permission>(...args, 'u.permissions'),
      permissionNotIn: (...args) => searchSet<User, Permission>(...args, 'u.permissions', true),
      verified: (q, verified) => q.andWhere('u.verified = :verified', { verified }),
    });

    return paginate<User>({
      type: 'User',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver()
  orders(
    @Root() { id }: User,
  ): Promise<Order[]> {
    return Order.find({ where: { userId: id } });
  }

  @FieldResolver()
  products(
    @Root() { id }: User,
  ): Promise<Product[]> {
    return Product.find({ where: { userId: id } });
  }

  @FieldResolver()
  payments(
    @Root() { id }: User,
  ): Promise<Payment[]> {
    return Payment.find({ where: { userId: id } });
  }

  @FieldResolver()
  registrations(
    @Root() { id }: User,
  ): Promise<Registration[]> {
    return Registration.find({ where: { userId: id } });
  }
}
