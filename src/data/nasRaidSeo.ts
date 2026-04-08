export type RaidLevel = 'raid0' | 'raid1' | 'raid5' | 'raid6' | 'raid10' | 'raidz1' | 'raidz2' | 'raidz3';

export type KeywordKind = 'brand' | 'region';

export type KeywordContext = {
  keywordKind?: KeywordKind;
  keywordKey?: string;
  keywordLabel?: string;
};

export type ScenarioEntry = {
  type: 'scenario';
  slug: string;
  drives: number;
  sizeTb: number;
  reservePct: number;
  level: RaidLevel;
  title: string;
  description: string;
} & KeywordContext;

export type ComparisonEntry = {
  type: 'comparison';
  slug: string;
  left: RaidLevel;
  right: RaidLevel;
  title: string;
  description: string;
} & KeywordContext;

export type NasRaidSeoEntry = ScenarioEntry | ComparisonEntry;

export const RAID_LABEL: Record<RaidLevel, string> = {
  raid0: 'RAID 0',
  raid1: 'RAID 1',
  raid5: 'RAID 5',
  raid6: 'RAID 6',
  raid10: 'RAID 10',
  raidz1: 'RAID-Z1',
  raidz2: 'RAID-Z2',
  raidz3: 'RAID-Z3'
};

const SCENARIO_DRIVES = [2, 3, 4, 5, 6, 8, 10, 12];
const SCENARIO_SIZES = [4, 6, 8, 10, 12, 14, 16, 18, 20];
const SCENARIO_LEVELS: RaidLevel[] = ['raid1', 'raid5', 'raid6', 'raid10', 'raidz1', 'raidz2'];
const DEFAULT_RESERVE = 10;

const KEYWORD_SCENARIO_DRIVES = [4, 6, 8, 10];
const KEYWORD_SCENARIO_SIZES = [8, 12, 16, 20];
const KEYWORD_SCENARIO_LEVELS: RaidLevel[] = ['raid5', 'raid6', 'raid10', 'raidz1', 'raidz2'];

const KEYWORD_MODIFIERS: Array<{ kind: KeywordKind; key: string; label: string }> = [
  { kind: 'brand', key: 'synology', label: 'Synology' },
  { kind: 'brand', key: 'qnap', label: 'QNAP' },
  { kind: 'brand', key: 'truenas', label: 'TrueNAS' },
  { kind: 'brand', key: 'unraid', label: 'Unraid' },
  { kind: 'region', key: 'us', label: 'US' },
  { kind: 'region', key: 'uk', label: 'UK' },
  { kind: 'region', key: 'eu', label: 'EU' },
  { kind: 'region', key: 'apac', label: 'APAC' }
];

const COMPARISON_PAIRS: Array<{ left: RaidLevel; right: RaidLevel }> = [
  { left: 'raid10', right: 'raid5' },
  { left: 'raid6', right: 'raid5' },
  { left: 'raidz2', right: 'raidz1' },
  { left: 'raidz2', right: 'raid6' },
  { left: 'raid1', right: 'raid5' },
  { left: 'raid10', right: 'raid6' },
  { left: 'raidz3', right: 'raidz2' },
  { left: 'raid0', right: 'raid10' }
];

export function parityCount(level: RaidLevel): number {
  if (level === 'raid5' || level === 'raidz1') return 1;
  if (level === 'raid6' || level === 'raidz2') return 2;
  if (level === 'raidz3') return 3;
  return 0;
}

export function minDrives(level: RaidLevel): number {
  switch (level) {
    case 'raid0': return 1;
    case 'raid1': return 2;
    case 'raid5': return 3;
    case 'raid6': return 4;
    case 'raid10': return 4;
    case 'raidz1': return 3;
    case 'raidz2': return 4;
    case 'raidz3': return 5;
  }
}

export function tolerance(level: RaidLevel, drives: number): string {
  if (level === 'raid0') return '0 drives';
  if (level === 'raid1') return `${Math.max(1, drives - 1)} drives*`;
  if (level === 'raid10') return '1 drive per mirror pair*';
  const p = parityCount(level);
  return `${p} drive${p > 1 ? 's' : ''}`;
}

export function usableDataDisks(level: RaidLevel, drives: number): number {
  if (level === 'raid0') return drives;
  if (level === 'raid1') return 1;
  if (level === 'raid10') return Math.floor(drives / 2);
  return Math.max(0, drives - parityCount(level));
}

export function calculateNasRaid(level: RaidLevel, drives: number, sizeTb: number, reservePct: number) {
  const min = minDrives(level);
  const validBase = drives >= min;
  const validRaid10 = level !== 'raid10' || drives % 2 === 0;

  const raw = Math.max(0, drives) * Math.max(0, sizeTb);
  const dataDisks = usableDataDisks(level, drives);
  const usableBeforeReserve = dataDisks * sizeTb;
  const reserveRatio = Math.max(0, Math.min(40, reservePct)) / 100;
  const usableAfterReserve = usableBeforeReserve * (1 - reserveRatio);
  const efficiency = raw > 0 ? (usableBeforeReserve / raw) * 100 : 0;

  return {
    valid: validBase && validRaid10,
    min,
    raid10Valid: validRaid10,
    raw,
    usableBeforeReserve,
    usableAfterReserve,
    efficiency,
    tolerance: tolerance(level, drives)
  };
}

function makeScenarioSlug(drives: number, sizeTb: number, level: RaidLevel): string {
  return `${drives}x-${sizeTb}tb-${level}-calculator`;
}

function makeComparisonSlug(left: RaidLevel, right: RaidLevel): string {
  return `${left}-vs-${right}-storage-capacity`;
}

function withModifierSlug(baseSlug: string, modifierKey: string): string {
  return `${modifierKey}-${baseSlug}`;
}

export function getScenarioEntries(): ScenarioEntry[] {
  const entries: ScenarioEntry[] = [];

  SCENARIO_DRIVES.forEach((drives) => {
    SCENARIO_SIZES.forEach((sizeTb) => {
      SCENARIO_LEVELS.forEach((level) => {
        const result = calculateNasRaid(level, drives, sizeTb, DEFAULT_RESERVE);
        if (!result.valid) return;

        const label = RAID_LABEL[level];
        const slug = makeScenarioSlug(drives, sizeTb, level);

        entries.push({
          type: 'scenario',
          slug,
          drives,
          sizeTb,
          reservePct: DEFAULT_RESERVE,
          level,
          title: `${drives}x ${sizeTb}TB ${label} NAS Calculator`,
          description: `Estimate usable capacity, fault tolerance, and efficiency for ${drives}x ${sizeTb}TB in ${label} with reserve best practices.`
        });
      });
    });
  });

  return entries;
}

export function getComparisonEntries(): ComparisonEntry[] {
  return COMPARISON_PAIRS.map(({ left, right }) => ({
    type: 'comparison',
    slug: makeComparisonSlug(left, right),
    left,
    right,
    title: `${RAID_LABEL[left]} vs ${RAID_LABEL[right]} Capacity Calculator`,
    description: `Compare usable capacity, fault tolerance, and efficiency between ${RAID_LABEL[left]} and ${RAID_LABEL[right]} for NAS and homelab arrays.`
  }));
}

export function getKeywordScenarioEntries(): ScenarioEntry[] {
  const base = getScenarioEntries().filter((entry) => (
    KEYWORD_SCENARIO_DRIVES.includes(entry.drives)
    && KEYWORD_SCENARIO_SIZES.includes(entry.sizeTb)
    && KEYWORD_SCENARIO_LEVELS.includes(entry.level)
  ));

  const entries: ScenarioEntry[] = [];
  base.forEach((entry) => {
    KEYWORD_MODIFIERS.forEach((modifier) => {
      const labelPrefix = modifier.kind === 'brand'
        ? `${modifier.label} `
        : `${modifier.label} `;
      const audienceHint = modifier.kind === 'brand'
        ? `for ${modifier.label} NAS users`
        : `for ${modifier.label} homelab buyers`;

      entries.push({
        ...entry,
        slug: withModifierSlug(entry.slug, modifier.key),
        keywordKind: modifier.kind,
        keywordKey: modifier.key,
        keywordLabel: modifier.label,
        title: `${labelPrefix}${entry.drives}x ${entry.sizeTb}TB ${RAID_LABEL[entry.level]} NAS Calculator`,
        description: `Estimate usable capacity, fault tolerance, and efficiency ${audienceHint} using ${entry.drives}x ${entry.sizeTb}TB in ${RAID_LABEL[entry.level]}.`
      });
    });
  });

  return entries;
}

export function getKeywordComparisonEntries(): ComparisonEntry[] {
  const base = getComparisonEntries();

  const entries: ComparisonEntry[] = [];
  base.forEach((entry) => {
    KEYWORD_MODIFIERS.forEach((modifier) => {
      const audienceHint = modifier.kind === 'brand'
        ? `${modifier.label} NAS users`
        : `${modifier.label} homelab setups`;

      entries.push({
        ...entry,
        slug: withModifierSlug(entry.slug, modifier.key),
        keywordKind: modifier.kind,
        keywordKey: modifier.key,
        keywordLabel: modifier.label,
        title: `${modifier.label} ${RAID_LABEL[entry.left]} vs ${RAID_LABEL[entry.right]} Calculator`,
        description: `Compare usable capacity, fault tolerance, and efficiency between ${RAID_LABEL[entry.left]} and ${RAID_LABEL[entry.right]} for ${audienceHint}.`
      });
    });
  });

  return entries;
}

export function getNasRaidSeoEntries(): NasRaidSeoEntry[] {
  return [
    ...getScenarioEntries(),
    ...getComparisonEntries(),
    ...getKeywordScenarioEntries(),
    ...getKeywordComparisonEntries()
  ];
}

export const NAS_RAID_BASE_ROUTES = 1;
export const NAS_RAID_PSEO_ROUTES = getNasRaidSeoEntries().length;
export const NAS_RAID_TOTAL_ROUTES = NAS_RAID_BASE_ROUTES + NAS_RAID_PSEO_ROUTES;
