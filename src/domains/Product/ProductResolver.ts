import { Resolver, Mutation, Query, Arg, Ctx, FieldResolver, Root } from 'type-graphql';
import { Asset } from '#/domains/Asset/AssetEntity';
import { Registration } from '#/domains/Registration/RegistrationEntity';
import { Product } from './ProductEntity';
import { CreateProductInput } from './inputs/CreateProductInput';
import { ProductWhereUniqueInput } from './inputs/ProductWhereUniqueInput';
import { ProductsWhereInput } from './inputs/ProductsWhereInput';
import { ProductCategory } from './ProductCategory';
import { Permission } from '#/domains/User/Permission';
import { User } from '#/domains/User/UserEntity';
import { UserInputError, ForbiddenError } from 'apollo-server-koa';
import { paginatedResponseType, paginate } from '#/data/pagination/';
import { PaginatedResponse } from '#/data/pagination/type';
import { prepareQuery, searchSet } from '#/data/utils/';
import * as App from '#/app/type';

const PaginatedProducts = paginatedResponseType(Product);

@Resolver(() => Product)
export class ProductResolver {
  @Mutation(() => Product)
  async createProduct(
    @Arg('data') data: CreateProductInput,
    @Ctx() { session }: App.Ctx,
  ): Promise<Product> {
    const {
      name,
      price,
      status,
      userId,
      categories,
      maxRegistrationsPerOrder,
    } = data;
    const user = await User.findOne(userId || session.userId);

    if (!user) {
      throw new UserInputError('could not find user');
    }

    if (!user.permissions.includes(Permission.CREATEPRODUCT)) { // @TOOD: permission checker?
      throw new ForbiddenError(`missing permission: ${Permission.CREATEPRODUCT}`);
    }

    return Product.create({
      name,
      price,
      status,
      user,
      categories,
      maxRegistrationsPerOrder,
    }).save();
  }

  @Query(() => Product, { nullable: true })
  product(
    @Arg('where') where: ProductWhereUniqueInput,
  ): Promise<Product | undefined> {
    const { id, name } = where;
    if (id) {
      return Product.findOne({ where: { id } });
    }
    return Product.findOne({ where: { name } });
  }

  @Query(() => PaginatedProducts)
  products(
    @Arg('where', { nullable: true }) where: ProductsWhereInput = {},
  ): Promise<PaginatedResponse<Product>> {
    const qb = Product
      .getRepository()
      .createQueryBuilder('p');

    const prepared = prepareQuery<Product>(where, {
      status: (q, status) => q.andWhere('p.status = :status', { status }),
      maxRegistrationsPerOrder: (q, max) => q.andWhere('p.maxRegistrationsPerOrder = :max', { max }),
      categoryIn: (...args) => searchSet<Product, ProductCategory>(...args, 'p.categories'),
      categoryNotIn: (...args) => searchSet<Product, ProductCategory>(...args, 'p.categories', true),
    });

    return paginate<Product>({
      type: 'Product',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver()
  user(
    @Root() { id }: Product,
  ): Promise<User | undefined> {
    return User
      .getRepository()
      .createQueryBuilder('u')
      .leftJoinAndSelect(Product, 'p', 'p.id = :id', { id })
      .getOne();
  }

  @FieldResolver()
  assets(
    @Root() { id }: Product,
  ): Promise<Asset[]> {
    return Asset
      .getRepository()
      .createQueryBuilder('a')
      .leftJoinAndSelect(Product, 'p', 'p.id = :id', { id })
      .getMany();
  }

  @FieldResolver()
  registrations(
    @Root() { id }: Product,
  ): Promise<Registration[]> {
    return Registration
      .getRepository()
      .createQueryBuilder('r')
      .leftJoinAndSelect(Product, 'p', 'p.id = :id', { id })
      .getMany();
  }
}
