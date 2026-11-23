import { makeAdmin } from './auth/make-admin.ts';
import { DB_FILE, openDatabase } from './database.ts';

const email = process.argv[2];

if (!email) {
  console.error('Usage: npm run make-admin <email>');
  process.exit(1);
}

if (!makeAdmin(openDatabase(DB_FILE), email)) {
  console.error(`No user with email ${email}`);
  process.exit(1);
}

console.log(`${email} is now an admin`);
