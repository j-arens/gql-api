const { compilerOptions: { paths } } = require('./tsconfig.json');

module.exports = {
  testEnvironment: '<rootDir>/dev/test-utils/TestEnv.js',
  setupFilesAfterEnv: ['<rootDir>/dev/test-utils/setup.js'],
  globalTeardown: '<rootDir>/dev/test-utils/teardown.js',
  moduleFileExtensions: [
    'js',
  ],
  testMatch: [
    '<rootDir>/dist/src/**/__tests__/*spec.js',
  ],
  testPathIgnorePatterns: [
    '/node_modules/',
  ],
  moduleNameMapper: Object.entries(paths).reduce((acc, [k, v]) => {
    acc[k.replace('*', '(.*)$')] = `<rootDir>/dist/${v[0].replace('*', '$1')}`;
    return acc;
  }, {}),
};
