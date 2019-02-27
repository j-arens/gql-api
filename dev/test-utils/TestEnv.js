const NodeEnvironment = require('jest-environment-node');
const connectMysql = require('../../dist/src/app/deps/mysql').default;

global.__TESTS_DBCONN__ = null;

class TestEnv extends NodeEnvironment {
  async setup() {
    // tests run in their own context, so we need to port over global constructors
    // otherwise equality checks with the instanceof operator will fail
    this.global.Array = global.Array;

    // the only way to share globals from the current process into the test context
    // is by setting them through a custom test environment, this is preferred
    // over creating and closing a db connection for every single test suite,
    if (!global.__TESTS_DBCONN__) {
      global.__TESTS_DBCONN__ = await connectMysql();
    }
    this.global.tests_dbconn = global.__TESTS_DBCONN__;

    await super.setup();
  }

  runScript(script) {
    return super.runScript(script);
  }
}

module.exports = TestEnv;
