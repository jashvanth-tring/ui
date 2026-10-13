import type { EmailCampaignAudience } from './email-campaign.types';

/** One row in the Meet-style recipient lists */
export interface CampaignPickerRecipient {
  key: string;
  kind: 'candidate' | 'client_spoc' | 'user' | 'email';
  entityId?: number;
  email?: string;
  label: string;
  sublabel?: string;
}

export interface CampaignRecipientRefPayload {
  kind: 'candidate' | 'client_spoc' | 'user' | 'email';
  entityId?: number;
  email?: string;
}

export function campaignRecipientsToPayload(
  list: CampaignPickerRecipient[],
): CampaignRecipientRefPayload[] {
  return list.map((r) =>
    r.kind === 'email'
      ? { kind: 'email', email: r.email }
      : { kind: r.kind, entityId: r.entityId },
  );
}

export function makeRecipientKey(r: Omit<CampaignPickerRecipient, 'key'>): string {
  if (r.kind === 'email' && r.email) return `email:${r.email.toLowerCase()}`;
  return `${r.kind}:${r.entityId}`;
}

/** Primary "To" list must only contain rows matching this audience kind */
export function validatePrimaryRecipients(
  audience: EmailCampaignAudience,
  list: CampaignPickerRecipient[],
): string | null {
  const rawEmail = list.find((r) => r.kind === 'email');
  if (rawEmail) {
    return 'Primary “To” must be people from the directory. Add standalone email addresses under CC or BCC only.';
  }
  const bad = list.find((r) => r.kind !== audience);
  if (bad) {
    return `Remove “${bad.label}” — primary recipients must all be ${audienceLabel(audience)}. Use CC/BCC for other types.`;
  }
  return null;
}

function audienceLabel(a: EmailCampaignAudience): string {
  if (a === 'candidate') return 'candidates';
  if (a === 'client_spoc') return 'clients';
  return 'users';
}
