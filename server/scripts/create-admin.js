#!/usr/bin/env node
/**
 * TapTrack NFC — Production Admin Account Bootstrap Script
 *
 * Usage:
 *   Interactive (Recommended):
 *     node scripts/create-admin.js
 *
 *   Non-interactive / CI:
 *     node scripts/create-admin.js [email] [password] [firstName] [lastName]
 *
 * Security:
 * - Interactive mode masks password input and prompts for confirmation
 * - CLI argument mode warns against leaking passwords in shell history
 * - Refuses to overwrite existing accounts
 * - Hashes password using bcrypt (10 rounds)
 * - Never prints plaintext passwords, password hashes, or database connection strings
 * - Never contains hardcoded or default credentials
 */

import 'dotenv/config';
import readline from 'readline';
import { Writable } from 'stream';
import bcrypt from 'bcrypt';
import { userRepository } from '../src/repositories/user.repository.js';
import pool from '../src/repositories/db.js';

/**
 * Prompt user for masked password without echoing characters to stdout
 */
function askPassword(promptText) {
  if (!process.stdin.isTTY) {
    const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
    return new Promise((resolve) => {
      rl.question(promptText, (answer) => {
        rl.close();
        resolve(answer);
      });
    });
  }

  return new Promise((resolve) => {
    let muted = false;
    const mutableStdout = new Writable({
      write(chunk, encoding, callback) {
        if (!muted) {
          process.stdout.write(chunk, encoding);
        }
        callback();
      },
    });

    const rl = readline.createInterface({
      input: process.stdin,
      output: mutableStdout,
      terminal: true,
    });

    process.stdout.write(promptText);
    muted = true;

    rl.question('', (answer) => {
      muted = false;
      process.stdout.write('\n');
      rl.close();
      resolve(answer);
    });
  });
}

/**
 * Standard readline prompt for visible text (email, name)
 */
function askQuestion(query) {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  return new Promise((resolve) => {
    rl.question(query, (answer) => {
      rl.close();
      resolve(answer);
    });
  });
}

async function main() {
  let email = process.argv[2];
  let password = process.argv[3];
  let firstName = process.argv[4];
  let lastName = process.argv[5];

  if (password) {
    console.warn('⚠️  Notice: Passing passwords via CLI arguments may expose them in shell history and process lists.');
    console.warn('   For production administration, running interactive mode (node scripts/create-admin.js) is recommended.\n');
  }

  // Interactive prompts if values were not provided via arguments
  if (!email) {
    email = await askQuestion('Admin Email: ');
  }

  if (!password) {
    password = await askPassword('Admin Password (min 8 chars): ');
    const confirmPassword = await askPassword('Confirm Admin Password: ');
    if (password !== confirmPassword) {
      console.error('Error: Passwords do not match.');
      process.exit(1);
    }
  }

  if (!firstName) {
    firstName = await askQuestion('First Name [Default: Admin]: ');
  }

  if (!lastName) {
    lastName = await askQuestion('Last Name [Default: User]: ');
  }

  email = (email || '').trim().toLowerCase();
  password = (password || '').trim();
  firstName = (firstName || 'Admin').trim();
  lastName = (lastName || 'User').trim();

  // Validate email
  if (!email || !email.includes('@') || !email.includes('.')) {
    console.error('Error: A valid email address is required.');
    process.exit(1);
  }

  // Validate password
  if (!password || password.length < 8) {
    console.error('Error: Password must be at least 8 characters long.');
    process.exit(1);
  }

  try {
    // Check if account exists
    const existing = await userRepository.findByEmail(email);
    if (existing) {
      console.error(`Error: User with email "${email}" already exists. Refusing to overwrite.`);
      process.exit(1);
    }

    console.log('Hashing password and provisioning administrator account...');
    const passwordHash = await bcrypt.hash(password, 10);

    const adminUser = await userRepository.create({
      email,
      passwordHash,
      firstName,
      lastName,
      role: 'ADMIN',
      status: 'ACTIVE',
      emailVerifiedAt: new Date(),
    });

    console.log(`\n✅ Administrator successfully created:`);
    console.log(`   ID:     ${adminUser.id}`);
    console.log(`   Email:  ${adminUser.email}`);
    console.log(`   Name:   ${adminUser.first_name} ${adminUser.last_name}`);
    console.log(`   Role:   ${adminUser.role}`);
    console.log(`   Status: ${adminUser.status}\n`);
  } catch (err) {
    // Redact connection strings or sensitive URI parameters from error output
    const safeError = (err.message || 'Unknown database error')
      .replace(/postgres(ql)?:\/\/[^@]+@/gi, 'postgresql://***:***@');
    console.error('Failed to create admin:', safeError);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

main();
