module.exports = async () => {
  if (global.__TESTS_DBCONN__) {
    await global.__TESTS_DBCONN__.close();
  }
};
