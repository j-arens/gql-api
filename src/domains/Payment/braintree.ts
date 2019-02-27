export default {
  gateway: {
    transaction: {
      // @ts-ignore
      sale: (...args: any) => Promise.resolve(({ sucess: true })),
    },
  },
};
