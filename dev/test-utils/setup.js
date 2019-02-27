const { getConnectionManager } = require('typeorm');

beforeAll(() => {
  // little hack to get typeorm repositories working in the custom test env
  const conn = global.tests_dbconn;
  const findMetadata = conn.constructor.prototype.findMetadata.bind(conn);
  conn.findMetadata = entity => {
    if (typeof entity === 'function') {
      return findMetadata(entity.name);
    }
    return findMetadata(entity);
  };
  getConnectionManager().connections = [conn];
});

// clear all tables before each test, keep things as atomic as possible
beforeEach(async done => {
  const tables = [
    'asset',
    'order',
    'ordersToProducts',
    'payment',
    'product',
    'registration',
    'user',
  ];
  const conn = global.tests_dbconn;
  const qr = await conn.driver.createQueryRunner();
  await qr.startTransaction();
  await qr.query('SET FOREIGN_KEY_CHECKS = 0;');
  await Promise.all(tables.map(table => qr.query(`TRUNCATE TABLE \`${table}\`;`)));
  await qr.query(`SET FOREIGN_KEY_CHECKS = 1;`);
  await qr.commitTransaction();
  qr.release();
  done();
});
