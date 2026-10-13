// Affiliate programs: single source of truth.
// status: 'pending' (default, not approved yet) | 'approved' (live) | 'paused' (hide everywhere)
// A program with status 'pending' must never show a commercial link.
// NOTE: Yachtico / FlexOffers is closed — it is deliberately excluded from this list.

export type ProgramStatus = 'pending' | 'approved' | 'paused';

export interface Program {
  name: string;
  kind: 'yacht' | 'jet';
  status: ProgramStatus;
  url: string;
  subParam: string;
  cta: string;
}

export const programs: Record<string, Program> = {
  boatbookings: { name: 'Boatbookings', kind: 'yacht', status: 'pending', url: '', subParam: '', cta: 'Request a yacht charter quote' },
  skippercity: { name: 'Skippercity', kind: 'yacht', status: 'pending', url: '', subParam: '', cta: 'Request a yacht charter quote' },
  privatejetfinder: { name: 'Private Jet Finder', kind: 'jet', status: 'pending', url: '', subParam: '', cta: 'Request a private jet quote' },
  jettly: { name: 'Jettly', kind: 'jet', status: 'pending', url: '', subParam: '', cta: 'Request a private jet quote' },
};

export function isApproved(key: string): boolean {
  return programs[key]?.status === 'approved' && programs[key]?.url.length > 0;
}

export function approvedPrograms(): Array<[string, Program]> {
  return Object.entries(programs).filter(([, p]) => p.status === 'approved' && p.url.length > 0);
}

export function firstApprovedOfKind(kind: 'yacht' | 'jet'): [string, Program] | null {
  const found = Object.entries(programs).find(([, p]) => p.kind === kind && p.status === 'approved' && p.url.length > 0);
  return found ?? null;
}
