import { Resolver, Mutation, Arg, Query, FieldResolver, Root } from 'type-graphql';
import { CreateAssetInput } from './inputs/CreateAssetInput';
import { AssetsWhereInput } from './inputs/AssetsWhereInput';
import { Asset } from './AssetEntity';
import { Product } from '#/domains/Product/ProductEntity';
import { UserInputError, ApolloError } from 'apollo-server-koa';
import { paginatedResponseType, paginate } from '#/data/pagination/';
import { PaginatedResponse } from '#/data/pagination/type';
import { prepareQuery } from '#/data/utils/';

const PaginatedAssets = paginatedResponseType(Asset);

@Resolver(() => Asset)
export class AssetResolver {
  @Mutation(() => Asset)
  async createAsset(
    @Arg('data') data: CreateAssetInput,
  ): Promise<Asset> {
    const {
      productId,
      fileName,
      version,
      clearance,
      location,
    } = data;

    const product = await Product.findOne(productId);
    if (!product) {
      throw new UserInputError('product does not exist');
    }

    const existing = await Asset.count({
      where: [{ product, fileName, version, location }],
    });
    if (existing) {
      throw new ApolloError('asset already exists');
    }

    return Asset.create({
      product,
      fileName,
      version,
      clearance,
      location,
    }).save();
  }

  @Query(() => Asset, { nullable: true })
  asset(
    @Arg('id') id: string,
  ): Promise<Asset | undefined> {
    return Asset.findOne(id);
  }

  @Query(() => PaginatedAssets)
  assets(
    @Arg('where', { nullable: true }) where: AssetsWhereInput = {},
  ): Promise<PaginatedResponse<Asset>> {
    const qb = Asset
      .getRepository()
      .createQueryBuilder('a');

    const prepared = prepareQuery<Asset>(where, {
      productId: (q, id) => q.andWhere('a.productId = :id', { id }),
      fileName: (q, name) => q.andWhere('a.fileName = :name', { name }),
      version: (q, version) => q.andWhere('a.version = :version', { version }),
      clearance: (q, clearance) => q.andWhere('a.clearance = :clearance', { clearance }),
      location: (q, location) => q.andWhere('a.location = :location', { location }),
    });

    return paginate<Asset>({
      type: 'Asset',
      page: where.page || 0,
      size: where.size || 25,
      query: prepared(qb),
    });
  }

  @FieldResolver()
  product(
    @Root() { id }: Asset,
  ): Promise<Product | undefined> {
    return Product
      .getRepository()
      .createQueryBuilder('p')
      .leftJoinAndSelect(Asset, 'a', 'a.id = :id', { id })
      .getOne();
  }
}
