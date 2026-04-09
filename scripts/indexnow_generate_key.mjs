import { randomBytes } from 'node:crypto';
import { mkdir, readdir, readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const projectRoot = path.resolve(__dirname, '..');
const publicDir = path.join(projectRoot, 'public');

function isHexKeyFile(name) {
  return /^[a-f0-9]{16,128}\.txt$/i.test(name);
}

async function findExistingIndexNowKey() {
  const files = await readdir(publicDir, { withFileTypes: true });
  for (const file of files) {
    if (!file.isFile() || !isHexKeyFile(file.name)) continue;
    const keyFromName = file.name.replace(/\.txt$/i, '');
    const body = (await readFile(path.join(publicDir, file.name), 'utf8')).trim();
    if (body === keyFromName) {
      return keyFromName;
    }
  }
  return null;
}

async function main() {
  const force = process.argv.includes('--force');
  await mkdir(publicDir, { recursive: true });

  if (!force) {
    const existing = await findExistingIndexNowKey();
    if (existing) {
      console.log(`Existing IndexNow key detected: ${existing}`);
      console.log(`Key file: public/${existing}.txt`);
      console.log('Use --force to generate a new key.');
      return;
    }
  }

  const key = randomBytes(16).toString('hex');
  const filename = `${key}.txt`;
  const filepath = path.join(publicDir, filename);

  await writeFile(filepath, `${key}\n`, 'utf8');

  console.log(`Generated IndexNow key: ${key}`);
  console.log(`Created file: public/${filename}`);
  console.log('Next step: commit and deploy this file so Bing can verify key ownership.');
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
