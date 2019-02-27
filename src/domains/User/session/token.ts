import {
  createCipheriv,
  createDecipheriv,
  randomBytes,
} from 'crypto';

interface EncryptResult {
  iv: string,
  result: string,
}

const KEY = process.env.SESSION_SECRET || '';
const ALGO = 'aes128';
const ENCODING = 'base64';

export const encrypt = (subject: string): EncryptResult => {
  const iv = randomBytes(16);
  const cipher = createCipheriv(ALGO, KEY, iv);
  let result = cipher.update(subject, 'utf8', ENCODING);
  result += cipher.final(ENCODING);
  return { result, iv: iv.toString('hex') };
};

export const decrypt = (subject: string, ivString: string): string => {
  const iv = Buffer.from(ivString);
  const decipher = createDecipheriv(ALGO, KEY, iv);
  let result = decipher.update(subject, ENCODING, 'utf8');
  result += decipher.final('utf8');
  return result;
};

export const create = (id: string): string => {
  const { result, iv } = encrypt(id);
  return [result, iv].join(',');
};

export const parse = (token: string): string => {
  const parts = token.split(',');
  const iv = parts[2];
  return decrypt(parts[1], iv);
};
