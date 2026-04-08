export type AppliancePreset = {
  id: string;
  name: string;
  powerW: number;
  hoursPerDay: number;
};

export type SolarVoltage = 12 | 24 | 48;
export type BatteryChemistry = 'lifepo4' | 'agm' | 'nmc';

export type SolarScenarioEntry = {
  type: 'scenario';
  slug: string;
  title: string;
  description: string;
  voltage: SolarVoltage;
  batteryChemistry: BatteryChemistry;
  appliances: AppliancePreset[];
  sunHours: number;
  autonomyDays: number;
};

export type SolarKeywordCategory = 'region' | 'chemistry' | 'brand';

export type SolarKeywordEntry = {
  type: 'keyword';
  slug: string;
  title: string;
  description: string;
  voltage: SolarVoltage;
  batteryChemistry: BatteryChemistry;
  appliances: AppliancePreset[];
  sunHours: number;
  autonomyDays: number;
  keywordCategory: SolarKeywordCategory;
  keywordKey: string;
  keywordLabel: string;
  highlight: string;
};

export type SolarComparisonEntry = {
  type: 'comparison';
  slug: string;
  title: string;
  description: string;
  voltage: SolarVoltage;
  compareBy: 'sun-hours' | 'voltage';
  appliances: AppliancePreset[];
};

export type OffGridSeoEntry = SolarScenarioEntry | SolarComparisonEntry | SolarKeywordEntry;

const APPLIANCE_PRESETS: AppliancePreset[] = [
  { id: 'fridge60x24', name: 'Fridge (60W x 24h)', powerW: 60, hoursPerDay: 24 },
  { id: 'microwave1000x016', name: 'Microwave (1000W x 10m)', powerW: 1000, hoursPerDay: 10 / 60 },
  { id: 'starlink75x8', name: 'Starlink (75W x 8h)', powerW: 75, hoursPerDay: 8 },
  { id: 'laptop90x6', name: 'Laptop (90W x 6h)', powerW: 90, hoursPerDay: 6 },
  { id: 'lights40x5', name: 'LED Lights (40W x 5h)', powerW: 40, hoursPerDay: 5 },
  { id: 'fan45x8', name: 'Vent Fan (45W x 8h)', powerW: 45, hoursPerDay: 8 },
  { id: 'cpap40x8', name: 'CPAP (40W x 8h)', powerW: 40, hoursPerDay: 8 },
  { id: 'induction1200x033', name: 'Induction (1200W x 20m)', powerW: 1200, hoursPerDay: 20 / 60 }
];

const VOLTAGES: SolarVoltage[] = [12, 24, 48];
const SUN_HOURS = [3, 4, 5, 6];
const AUTONOMY_DAYS = [1, 2];

const SCENARIO_GROUPS: AppliancePreset[][] = [
  ['fridge60x24', 'microwave1000x016'].map((id) => APPLIANCE_PRESETS.find((a) => a.id === id)).filter((a): a is AppliancePreset => Boolean(a)),
  ['fridge60x24', 'microwave1000x016', 'lights40x5'].map((id) => APPLIANCE_PRESETS.find((a) => a.id === id)).filter((a): a is AppliancePreset => Boolean(a)),
  ['fridge60x24', 'starlink75x8', 'laptop90x6', 'lights40x5'].map((id) => APPLIANCE_PRESETS.find((a) => a.id === id)).filter((a): a is AppliancePreset => Boolean(a)),
  ['fridge60x24', 'cpap40x8', 'fan45x8', 'lights40x5'].map((id) => APPLIANCE_PRESETS.find((a) => a.id === id)).filter((a): a is AppliancePreset => Boolean(a)),
  ['fridge60x24', 'microwave1000x016', 'induction1200x033', 'lights40x5'].map((id) => APPLIANCE_PRESETS.find((a) => a.id === id)).filter((a): a is AppliancePreset => Boolean(a))
];

export const ELECTRICAL_DEFAULTS = {
  batteryDoD: 0.9,
  inverterEfficiency: 0.9,
  chargeEfficiency: 0.92,
  panelDerate: 0.75
};

export const CHEMISTRY_DEFAULTS: Record<BatteryChemistry, typeof ELECTRICAL_DEFAULTS> = {
  lifepo4: {
    batteryDoD: 0.9,
    inverterEfficiency: 0.92,
    chargeEfficiency: 0.94,
    panelDerate: 0.78
  },
  agm: {
    batteryDoD: 0.55,
    inverterEfficiency: 0.88,
    chargeEfficiency: 0.86,
    panelDerate: 0.72
  },
  nmc: {
    batteryDoD: 0.8,
    inverterEfficiency: 0.91,
    chargeEfficiency: 0.92,
    panelDerate: 0.76
  }
};

const REGION_PRESETS: Array<{ key: string; label: string; sunHours: number; autonomyDays: number; highlight: string }> = [
  { key: 'arizona', label: 'Arizona', sunHours: 6.5, autonomyDays: 1, highlight: 'High irradiance region with strong summer output.' },
  { key: 'texas', label: 'Texas', sunHours: 5.6, autonomyDays: 1, highlight: 'Balanced shoulder-season irradiance and heat-driven load spikes.' },
  { key: 'california', label: 'California', sunHours: 5.4, autonomyDays: 1, highlight: 'Strong annual sun profile with stable planning assumptions.' },
  { key: 'uk-winter', label: 'UK Winter', sunHours: 2.3, autonomyDays: 2, highlight: 'Low winter sun window requiring larger battery and panel overhead.' }
];

const CHEMISTRY_PRESETS: Array<{ key: BatteryChemistry; label: string; highlight: string }> = [
  { key: 'lifepo4', label: 'LiFePO4', highlight: 'Deep-cycle friendly chemistry with high usable DoD and cycle life.' },
  { key: 'agm', label: 'AGM Lead Acid', highlight: 'Lower upfront cost but reduced usable DoD and charging efficiency.' },
  { key: 'nmc', label: 'NMC Lithium', highlight: 'High energy density chemistry for compact systems and mobile builds.' }
];

const BRAND_PRESETS: Array<{ key: string; label: string; applianceIds: string[]; sunHours: number; autonomyDays: number; highlight: string; chemistry: BatteryChemistry }> = [
  {
    key: 'starlink-rv',
    label: 'Starlink RV',
    applianceIds: ['starlink75x8', 'laptop90x6', 'lights40x5'],
    sunHours: 4.8,
    autonomyDays: 1,
    highlight: 'Connectivity-heavy travel profile optimized around comms uptime.',
    chemistry: 'lifepo4'
  },
  {
    key: 'dometic-cooling',
    label: 'Dometic Cooling',
    applianceIds: ['fridge60x24', 'fan45x8', 'lights40x5'],
    sunHours: 4.5,
    autonomyDays: 2,
    highlight: 'Cooling-priority profile with overnight cycling emphasis.',
    chemistry: 'lifepo4'
  },
  {
    key: 'ecoflow-backup',
    label: 'EcoFlow Backup',
    applianceIds: ['fridge60x24', 'microwave1000x016', 'lights40x5'],
    sunHours: 4.6,
    autonomyDays: 1,
    highlight: 'Portable power station style usage with burst cooking loads.',
    chemistry: 'nmc'
  },
  {
    key: 'victron-vanlife',
    label: 'Victron Vanlife',
    applianceIds: ['fridge60x24', 'starlink75x8', 'cpap40x8', 'lights40x5'],
    sunHours: 4.7,
    autonomyDays: 2,
    highlight: 'Always-on vanlife architecture with conservative autonomy headroom.',
    chemistry: 'lifepo4'
  }
];

export function dailyLoadWh(appliances: AppliancePreset[]): number {
  return appliances.reduce((sum, item) => sum + (item.powerW * item.hoursPerDay), 0);
}

export function estimateOffGridSystem(args: {
  appliances: AppliancePreset[];
  voltage: SolarVoltage;
  sunHours: number;
  autonomyDays: number;
  batteryChemistry?: BatteryChemistry;
  batteryDoD?: number;
  inverterEfficiency?: number;
  chargeEfficiency?: number;
  panelDerate?: number;
}) {
  const chemistry = args.batteryChemistry ?? 'lifepo4';
  const chemistryDefaults = CHEMISTRY_DEFAULTS[chemistry];

  const batteryDoD = args.batteryDoD ?? chemistryDefaults.batteryDoD;
  const inverterEfficiency = args.inverterEfficiency ?? chemistryDefaults.inverterEfficiency;
  const chargeEfficiency = args.chargeEfficiency ?? chemistryDefaults.chargeEfficiency;
  const panelDerate = args.panelDerate ?? chemistryDefaults.panelDerate;

  const whDaily = dailyLoadWh(args.appliances);
  const whRequired = whDaily * args.autonomyDays;
  const effectiveBatteryWh = whRequired / Math.max(0.55, batteryDoD * inverterEfficiency);
  const batteryAh = effectiveBatteryWh / args.voltage;

  const panelW = whDaily / Math.max(1.5, args.sunHours) / Math.max(0.5, chargeEfficiency * panelDerate);

  return {
    whDaily,
    whRequired,
    batteryAh,
    panelW,
    recommendedInverterW: Math.max(...args.appliances.map((a) => a.powerW), 300) * 1.25
  };
}

function applianceSlug(items: AppliancePreset[]): string {
  return items
    .map((a) => `${a.powerW}w-${Math.round(a.hoursPerDay * 60)}m`)
    .join('-plus-');
}

function scenarioSlug(appliances: AppliancePreset[], voltage: SolarVoltage, sunHours: number, autonomyDays: number): string {
  return `${applianceSlug(appliances)}-${voltage}v-${sunHours}sunh-${autonomyDays}day-off-grid-solar-battery-calculator`;
}

function comparisonSlug(voltage: SolarVoltage, profile: number): string {
  return `12v-vs-24v-vs-48v-off-grid-solar-battery-calculator-${voltage}v-profile-${profile}`;
}

function keywordScenarioSlug(keywordPrefix: string, appliances: AppliancePreset[], voltage: SolarVoltage, sunHours: number, autonomyDays: number): string {
  return `${keywordPrefix}-${applianceSlug(appliances)}-${voltage}v-${sunHours}sunh-${autonomyDays}day-off-grid-solar-battery-calculator`;
}

function pickAppliances(ids: string[]): AppliancePreset[] {
  return ids
    .map((id) => APPLIANCE_PRESETS.find((item) => item.id === id))
    .filter((item): item is AppliancePreset => Boolean(item));
}

function scenarioTitle(appliances: AppliancePreset[], voltage: SolarVoltage, sunHours: number, autonomyDays: number): string {
  const head = appliances
    .slice(0, 2)
    .map((a) => `${a.powerW}W ${a.name.split('(')[0].trim()}`)
    .join(' + ');
  return `${head} ${voltage}V Solar Calculator`;
}

export function getSolarScenarioEntries(): SolarScenarioEntry[] {
  const entries: SolarScenarioEntry[] = [];

  SCENARIO_GROUPS.forEach((appliances) => {
    VOLTAGES.forEach((voltage) => {
      SUN_HOURS.forEach((sunHours) => {
        AUTONOMY_DAYS.forEach((autonomyDays) => {
          entries.push({
            type: 'scenario',
            slug: scenarioSlug(appliances, voltage, sunHours, autonomyDays),
            title: scenarioTitle(appliances, voltage, sunHours, autonomyDays),
            description: `Calculate daily Wh, LiFePO4 battery Ah, and solar panel watts for ${voltage}V off-grid systems using a ${sunHours}h solar window and ${autonomyDays}-day autonomy target.`,
            voltage,
            batteryChemistry: 'lifepo4',
            appliances,
            sunHours,
            autonomyDays
          });
        });
      });
    });
  });

  return entries;
}

export function getSolarComparisonEntries(): SolarComparisonEntry[] {
  return SCENARIO_GROUPS.map((appliances, index) => {
    const voltage = VOLTAGES[index % VOLTAGES.length];
    const profile = index + 1;
    return {
      type: 'comparison',
      slug: comparisonSlug(voltage, profile),
      title: `${voltage}V Solar Comparison Calculator`,
      description: 'Compare required battery Ah and panel watts across 12V, 24V, and 48V architectures for the same appliance load profile.',
      voltage,
      compareBy: 'voltage',
      appliances
    };
  });
}

export function getSolarKeywordEntries(): SolarKeywordEntry[] {
  const entries: SolarKeywordEntry[] = [];
  const regionProfiles = SCENARIO_GROUPS.slice(0, 3);

  REGION_PRESETS.forEach((region) => {
    regionProfiles.forEach((appliances, profileIndex) => {
      VOLTAGES.forEach((voltage) => {
        entries.push({
          type: 'keyword',
          slug: keywordScenarioSlug(`off-grid-solar-${region.key}-profile-${profileIndex + 1}`, appliances, voltage, region.sunHours, region.autonomyDays),
          title: `${region.label} ${voltage}V Solar Calculator`,
          description: `Size battery Ah and panel watts for ${region.label} conditions at ${voltage}V using ${region.sunHours} peak sun hours and ${region.autonomyDays}-day backup assumptions.`,
          voltage,
          batteryChemistry: 'lifepo4',
          appliances,
          sunHours: region.sunHours,
          autonomyDays: region.autonomyDays,
          keywordCategory: 'region',
          keywordKey: region.key,
          keywordLabel: region.label,
          highlight: region.highlight
        });
      });
    });
  });

  CHEMISTRY_PRESETS.forEach((chemistry) => {
    VOLTAGES.forEach((voltage) => {
      const appliances = SCENARIO_GROUPS[2] ?? SCENARIO_GROUPS[0];
      entries.push({
        type: 'keyword',
        slug: keywordScenarioSlug(`off-grid-solar-${chemistry.key}`, appliances, voltage, 4.5, chemistry.key === 'agm' ? 2 : 1),
        title: `${chemistry.label} ${voltage}V Solar Calculator`,
        description: `Estimate Ah, panel watts, and inverter baseline for ${chemistry.label} chemistry at ${voltage}V with a realistic RV appliance stack.`,
        voltage,
        batteryChemistry: chemistry.key,
        appliances,
        sunHours: 4.5,
        autonomyDays: chemistry.key === 'agm' ? 2 : 1,
        keywordCategory: 'chemistry',
        keywordKey: chemistry.key,
        keywordLabel: chemistry.label,
        highlight: chemistry.highlight
      });
    });
  });

  BRAND_PRESETS.forEach((brand) => {
    const appliances = pickAppliances(brand.applianceIds);
    VOLTAGES.forEach((voltage) => {
      entries.push({
        type: 'keyword',
        slug: keywordScenarioSlug(`off-grid-solar-${brand.key}`, appliances, voltage, brand.sunHours, brand.autonomyDays),
        title: `${brand.label} ${voltage}V Solar Calculator`,
        description: `Compute battery Ah and panel watts for ${brand.label} style appliance usage at ${voltage}V with ${brand.sunHours} sun hours.`,
        voltage,
        batteryChemistry: brand.chemistry,
        appliances,
        sunHours: brand.sunHours,
        autonomyDays: brand.autonomyDays,
        keywordCategory: 'brand',
        keywordKey: brand.key,
        keywordLabel: brand.label,
        highlight: brand.highlight
      });
    });
  });

  return entries;
}

export function getSolarKeywordEntriesByCategory(category: SolarKeywordCategory): SolarKeywordEntry[] {
  return getSolarKeywordEntries().filter((entry) => entry.keywordCategory === category);
}

export function getOffGridSolarSeoEntries(): OffGridSeoEntry[] {
  return [...getSolarScenarioEntries(), ...getSolarComparisonEntries(), ...getSolarKeywordEntries()];
}

export const OFFGRID_SOLAR_BASE_ROUTES = 1;
export const OFFGRID_SOLAR_PSEO_ROUTES = getOffGridSolarSeoEntries().length;
export const OFFGRID_SOLAR_TOTAL_ROUTES = OFFGRID_SOLAR_BASE_ROUTES + OFFGRID_SOLAR_PSEO_ROUTES;
