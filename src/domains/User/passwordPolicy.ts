// @ts-ignore - no type defs
import { PasswordPolicy, charsets } from 'password-sheriff';

export const policy = new PasswordPolicy({
  length: {
    minLength: 6
  },
  contains: {
    atLeast: 2,
    expressions: [
      charsets.numbers,
      charsets.specialCharacters,
    ],
  },
});
