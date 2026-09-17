#!/usr/bin/env node
import { randomBytes, scryptSync } from "node:crypto";
import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

const N = 16384;
const r = 8;
const p = 1;
const keylen = 32;
const maxmem = 64 * 1024 * 1024;

const fromArg = process.argv.slice(2).join(" ").trim();
let password = fromArg;

if (!password) {
  const rl = createInterface({ input, output });
  password = (await rl.question("Senha dos noivos: ")).trim();
  rl.close();
}

if (!password) {
  console.error("Informe uma senha.");
  process.exit(1);
}

const salt = randomBytes(16);
const hash = scryptSync(password, salt, keylen, { N, r, p, maxmem });
const encoded = `scrypt:${N}:${r}:${p}:${salt.toString("base64")}:${hash.toString("base64")}`;

console.log("\nCole no .env.local / Vercel:\n");
console.log(`ADMIN_PASSWORD_HASH=${encoded}`);
