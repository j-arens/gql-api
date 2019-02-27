import { bootstrap } from './app/bootstrap';
import {
  getSessionCookie,
  setSessionCookie,
  expireSessionCookie,
} from '#/middleware/session';

const opts = {
  port: process.env.PORT || 2002,
  cors: {
    credentials: true,
    origin: '*', // @TODO
  },
};

bootstrap()
  .then(({ server, app }) => {

    // app.proxy = true; // set for cookies if running behind a proxy
    app.keys = [process.env.SESSION_KEY || ''];

    app.use(getSessionCookie);
    app.use(setSessionCookie);
    app.use(expireSessionCookie);

    server.applyMiddleware({ app });
    
    app.listen(opts, () => {
      const protocol = process.env.PROTOCOL;
      const domain = process.env.DOMAIN;
      const port = opts.port;
      const { graphqlPath } = server;
      console.log(`Server ready at ${protocol}://${domain}:${port}${graphqlPath}`);
    });
  })
  .catch(err => {
    console.error(err);
    process.exit(1);
  });
