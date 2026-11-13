import config from './config.json';

export type ZoneKind =
  | 'start'
  | 'consulting'
  | 'integration'
  | 'security'
  | 'markets'
  | 'cloud'
  | 'ai'
  | 'vault'
  | 'contact';

export interface ZoneLink {
  label: string;
  href: string;
}

export interface Zone {
  id: string;
  kind: ZoneKind;
  title: string;
  subtitle: string;
  period: string;
  year: string;
  color: string;
  x: number;
  z: number;
  radius: number;
  tech: string[];
  bullets: string[];
  links: ZoneLink[];
}

interface Stop {
  id: string;
  kind: ZoneKind;
  company: string;
  role: string;
  year: string;
  color: string;
  x: number;
  z: number;
}

/** Career stops in the order you travel them (oldest first). */
const STOPS: Stop[] = [
  { id: 'infovity', kind: 'consulting', company: 'Infovity', role: 'Technical Consultant', year: '2018', color: '#60a5fa', x: -26, z: 30 },
  { id: 'kloudgin', kind: 'integration', company: 'Kloudgin', role: 'Software Engineer', year: '2019', color: '#a78bfa', x: -40, z: 4 },
  { id: 'aardwolf', kind: 'security', company: 'Aardwolf Security', role: 'Software Engineer', year: '2019', color: '#f87171', x: -24, z: -24 },
  { id: 'smallcase', kind: 'markets', company: 'smallcase', role: 'Software Development Engineer 1', year: '2022', color: '#34d399', x: 4, z: -14 },
  { id: 'paypal-cloud', kind: 'cloud', company: 'PayPal', role: 'Software Engineer 2', year: '2023', color: '#38bdf8', x: 26, z: 10 },
  { id: 'paypal-ai', kind: 'ai', company: 'PayPal', role: 'Software Engineer 3', year: '2024', color: '#f472b6', x: 42, z: -12 },
  { id: 'keenai', kind: 'vault', company: 'KeenAi Global', role: 'Senior Associate', year: '2025', color: '#fbbf24', x: 24, z: -40 },
];

export const ZONE_RADIUS = 9;

function jobZone(stop: Stop): Zone {
  const job = config.jobs.find((j) => j.companyName === stop.company && j.role === stop.role);
  if (!job) throw new Error(`No job in config.json for ${stop.company} / ${stop.role}`);
  return {
    id: stop.id,
    kind: stop.kind,
    title: job.companyName,
    subtitle: job.role,
    period: job.time,
    year: stop.year,
    color: stop.color,
    x: stop.x,
    z: stop.z,
    radius: ZONE_RADIUS,
    tech: job.tech,
    bullets: job.description,
    links: [],
  };
}

export const EMAIL = 'me@hkmekala.me';
export const ROLE = 'Senior Software Engineer';
export const TAGLINE = 'Backend systems, cloud infrastructure and AI platforms.';

export const profile = {
  name: config.name,
  greeting: config.greeting,
  about: config.about,
  social: config.social,
};

export const contactLinks: ZoneLink[] = [
  { label: 'Email', href: `mailto:${EMAIL}` },
  { label: 'GitHub', href: config.social.github },
  { label: 'LinkedIn', href: config.social.linkedin },
  { label: 'Twitter', href: config.social.twitter },
  { label: 'Résumé', href: config.social.resume },
];

export const zones: Zone[] = [
  {
    id: 'start',
    kind: 'start',
    title: config.name,
    subtitle: ROLE,
    period: '7+ years',
    year: 'Hi',
    color: '#5eead4',
    x: 0,
    z: 46,
    radius: ZONE_RADIUS,
    tech: [],
    bullets: config.about,
    links: [],
  },
  ...STOPS.map(jobZone),
  {
    id: 'contact',
    kind: 'contact',
    title: 'Say hi',
    subtitle: 'Open to a good conversation',
    period: EMAIL,
    year: 'Now',
    color: '#5eead4',
    x: -4,
    z: -50,
    radius: ZONE_RADIUS,
    tech: [],
    bullets: ['Got a hard backend problem, a migration nobody wants, or an AI platform to scale? Reach out.'],
    links: contactLinks,
  },
];

/** Jobs newest first, for the plain résumé view. */
export const jobsNewestFirst: Zone[] = zones.filter((z) => z.kind !== 'start' && z.kind !== 'contact').reverse();

export const allTech: string[] = Array.from(new Set(zones.flatMap((z) => z.tech)));
