import { readFile, writeFile } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const SERVICES_PATH = path.resolve(__dirname, '../src/data/services.json');

const GROUPS = ['apps', 'databases', 'proxies'];

function parseImage(image) {
  const [repository, tag = 'latest'] = image.split(':');
  return { repository, tag };
}

function parseTagParts(tag) {
  const semverMatch = tag.match(/^(\d+)(?:\.(\d+))?(?:\.(\d+))?(.*)$/);
  if (!semverMatch) return null;

  const major = Number(semverMatch[1] ?? 0);
  const minor = Number(semverMatch[2] ?? 0);
  const patch = Number(semverMatch[3] ?? 0);
  const suffix = semverMatch[4] ?? '';

  return { major, minor, patch, suffix };
}

function scoreTag(tag) {
  const parsed = parseTagParts(tag);
  if (!parsed) return null;

  return {
    major: parsed.major,
    minor: parsed.minor,
    patch: parsed.patch,
    length: tag.length,
  };
}

function compareTagScore(a, b) {
  if (a.major !== b.major) return b.major - a.major;
  if (a.minor !== b.minor) return b.minor - a.minor;
  if (a.patch !== b.patch) return b.patch - a.patch;
  return a.length - b.length;
}

function sanitizeRepository(repository) {
  // Docker Hub official images are under the library namespace.
  if (repository.includes('/')) return repository;
  return `library/${repository}`;
}

async function fetchDockerHubTags(repository) {
  const normalizedRepo = sanitizeRepository(repository);
  const tags = [];
  let next = `https://registry.hub.docker.com/v2/repositories/${normalizedRepo}/tags?page_size=100`;

  while (next) {
    const response = await fetch(next, {
      headers: {
        Accept: 'application/json',
        'User-Agent': 'docker-compose-generator-auto-updater',
      },
    });

    if (!response.ok) {
      throw new Error(`Docker Hub API error (${response.status}) for ${repository}`);
    }

    const data = await response.json();
    for (const item of data.results ?? []) {
      if (item.name) {
        tags.push(item.name);
      }
    }

    next = data.next;
    if (tags.length >= 300) break;
  }

  return tags;
}

function pickTag(currentTag, allTags) {
  if (currentTag === 'latest') {
    return 'latest';
  }

  const currentParts = parseTagParts(currentTag);
  if (!currentParts) {
    return allTags.includes(currentTag) ? currentTag : currentTag;
  }

  const candidates = allTags.filter((tag) => {
    const parts = parseTagParts(tag);
    if (!parts) return false;

    // Keep compatibility by staying in the same major stream and variant suffix.
    return parts.major === currentParts.major && parts.suffix === currentParts.suffix;
  });

  if (candidates.length === 0) {
    return currentTag;
  }

  const sorted = [...candidates].sort((a, b) => compareTagScore(scoreTag(a), scoreTag(b)));
  return sorted[0];
}

async function updateServiceItem(item) {
  const { repository, tag } = parseImage(item.image);
  const allTags = await fetchDockerHubTags(repository);
  const nextTag = pickTag(tag, allTags);
  const updatedImage = `${repository}:${nextTag}`;

  return {
    ...item,
    image: updatedImage,
    _changed: updatedImage !== item.image,
  };
}

async function updateData() {
  const source = await readFile(SERVICES_PATH, 'utf8');
  const services = JSON.parse(source);

  let changedCount = 0;

  for (const group of GROUPS) {
    const items = services[group] ?? [];
    const updatedItems = [];

    for (const item of items) {
      try {
        const updated = await updateServiceItem(item);
        if (updated._changed) changedCount += 1;

        const { _changed, ...cleaned } = updated;
        updatedItems.push(cleaned);
      } catch (error) {
        console.warn(`Skip ${item.id}: ${error.message}`);
        updatedItems.push(item);
      }
    }

    services[group] = updatedItems;
  }

  await writeFile(SERVICES_PATH, `${JSON.stringify(services, null, 2)}\n`, 'utf8');
  console.log(`Update completed. Changed images: ${changedCount}`);
}

updateData().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
