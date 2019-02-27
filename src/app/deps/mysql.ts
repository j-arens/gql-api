import { createConnection } from 'typeorm';
import * as path from 'path';

export default () => createConnection({
  type: 'mysql',
  host: process.env.DB_HOST || 'localhost',
  port: parseInt(process.env.DB_PORT || '2000', 10),
  username: process.env.DB_USER || 'root',
  password: process.env.DB_PW || 'root',
  database: process.env.DB_DATABASE || 'api_dev',
  entities: [path.join(__dirname, `../../domains/**/*Entity.*`)],
  synchronize: process.env.NODE_ENV !== 'production',
  dropSchema: process.env.NODE_ENV === 'test',
  // logging: true,
});
