import { UserResolver } from '../UserResolver';
import { User } from '../UserEntity';
import { Permission } from '../Permission';
import { partialMockUser } from '#dev/test-utils/helpers';

describe('UserResolver', () => {
  describe('@Mutation createUser', () => {
    it('creates a user', async () => {
      const user = partialMockUser();
      const result = await new UserResolver().createUser(user);
      expect(result).toMatchObject({
        ...user,
        password: null,
      });
    });
  
    it('creates users without a password', async () => {
      const user = partialMockUser();
      const result = await new UserResolver().createUser(user);
      expect(result.password).toBeNull();
    });
  
    it('requires strong passwords if one is provided', async () => {
      const user = partialMockUser();
      user.password = 'weak';
      await expect(new UserResolver().createUser(user)).rejects.toThrowError();
    });
  
    it('hashes the password if one is provided', async () => {
      const user = partialMockUser();
      user.password = '%=NQuBpw&x?a9xeM';
      const result = await new UserResolver().createUser(user);
      expect(result.password).not.toEqual(user.password);
    });
  
    it('normalizes email addresses', async () => {
      const user = partialMockUser();
      user.email = ' LOLwhatever@BRO.com     ';
      const result = await new UserResolver().createUser(user);
      expect(result.email).toBe('lolwhatever@bro.com');
    });
  });

  describe('@Query user', () => {
    it('queries user by id', async () => {
      const user = await User.create(partialMockUser()).save();
      const result = await new UserResolver().user({ id: user.id });
      expect(result).toMatchObject(user);
    });
  
    it('queries user by email', async () => {
      const user = await User.create(partialMockUser()).save();
      const result = await new UserResolver().user({ email: user.email });
      expect(result).toMatchObject(user);
    });
  
    it('returns undefined if a user is not found', async () => {
      const result = await new UserResolver().user({ id: '1234' });
      expect(result).toBeUndefined();
    });
  });

  describe('@Query users', () => {
    it('returns a paginated response', async () => {
      const result = await new UserResolver().users();
      expect(result).toEqual(expect.objectContaining({
        total: expect.any(Number),
        page: 0,
        size: 25,
      }));
    });
  
    it('queries all users', async () => {
      await Promise.all(Array(5).fill(null).map(() => User.create(partialMockUser()).save()));
      const result = await new UserResolver().users();
      expect(result!.total).toBe(5);
    });
  
    it('returns an empty array if no users are found', async () => {
      const result = await new UserResolver().users();
      expect(Array.isArray(result!.data)).toBe(true);
      expect(result!.data.length).toBe(0);
    });
  
    it('queries verified users', async () => {
      const users = [
        {
          ...partialMockUser(),
          verified: true,
        },
        {
          ...partialMockUser(),
          verified: true,
        },
        partialMockUser(),
        partialMockUser(),
      ];
      await Promise.all(users.map(user => User.create(user).save()));
      const result = await new UserResolver().users({ verified: true });
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(users[0]),
        expect.objectContaining(users[1]),
      ]));
    });
  
    it('queries un-verified users', async () => {
      const users = [
        {
          ...partialMockUser(),
          verified: true,
        },
        {
          ...partialMockUser(),
          verified: true,
        },
        partialMockUser(),
        partialMockUser(),
      ];
      await Promise.all(users.map(user => User.create(user).save()));
      const result = await new UserResolver().users({ verified: false });
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(users[2]),
        expect.objectContaining(users[3]),
      ]));
    });
  
    it('queries users with the given permissions', async () => {
      const users = [
        {
          ...partialMockUser(),
          permissions: [Permission.UPDATEORDER],
        },
        {
          ...partialMockUser(),
          permissions: [Permission.UPDATEASSET],
        },
      ];
      await Promise.all(users.map(user => User.create(user).save()));
      const result = await new UserResolver().users({ permissionIn: [Permission.UPDATEORDER] });
      expect(result!.data[0]).toEqual(expect.objectContaining(users[0]));
    });
  
    it('queries users without the given permissions', async () => {
      const users = [
        {
          ...partialMockUser(),
          permissions: [Permission.UPDATEORDER],
        },
        {
          ...partialMockUser(),
          permissions: [Permission.UPDATEASSET],
        },
      ];
      await Promise.all(users.map(user => User.create(user).save()));
      const result = await new UserResolver().users({ permissionNotIn: [Permission.READASSET] });
      expect(result!.data).toEqual(expect.arrayContaining([
        expect.objectContaining(users[0]),
        expect.objectContaining(users[1]),
      ]));
    });
  });

  // describe('@FieldResolver orders', () => {
  //   it('resolves orders connected to a user', () => {

  //   });
  // });

  // describe('@FieldResolver products', () => {
  //   it('resolves products connected to a user', () => {
      
  //   });
  // });

  // describe('@FieldResolver payments', () => {
  //   it('resolves payments connected to a user', () => {
      
  //   });
  // });

  // describe('@FieldResolver registrations', () => {
  //   it('resolves registrations connected to a user', () => {
      
  //   });
  // });
});
