import { randomBytes, scrypt, timingSafeEqual } from 'node:crypto';
import { promisify } from 'node:util';

const scryptAsync = promisify(scrypt) as (
  password: string,
  salt: string,
  length: number,
) => Promise<Buffer>;
const KEY_LENGTH = 64;

export const hashPassword = async (password: string): Promise<string> => {
  const salt = randomBytes(16).toString('hex');
  return `${salt}:${(await scryptAsync(password, salt, KEY_LENGTH)).toString('hex')}`;
};

export const verifyPassword = async (password: string, stored: string): Promise<boolean> => {
  const [salt, hash] = stored.split(':');
  return timingSafeEqual(Buffer.from(hash, 'hex'), await scryptAsync(password, salt, KEY_LENGTH));
};
