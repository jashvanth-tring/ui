export type EmailCampaignAudience = 'candidate' | 'client_spoc' | 'user';

export interface EmailCampaignAudienceSettings {
  enabled: boolean;
  primaryEmailField: string;
  toOverride?: string | null;
  cc?: string[];
  bcc?: string[];
  staticMerge?: Record<string, string>;
}

export type EmailCampaignAudienceConfigMap = Record<
  EmailCampaignAudience,
  EmailCampaignAudienceSettings
>;

export const defaultAudienceConfig = (): EmailCampaignAudienceConfigMap => ({
  candidate: {
    enabled: true,
    primaryEmailField: 'emailId',
    toOverride: null,
    cc: [],
    bcc: [],
    staticMerge: {},
  },
  client_spoc: {
    enabled: true,
    primaryEmailField: 'emailId',
    toOverride: null,
    cc: [],
    bcc: [],
    staticMerge: {},
  },
  user: {
    enabled: true,
    primaryEmailField: 'officialEmail',
    toOverride: null,
    cc: [],
    bcc: [],
    staticMerge: {},
  },
});

export interface EmailCampaignTemplate {
  id: number;
  name: string;
  description: string | null;
  subjectTemplate: string;
  bodyHtml: string;
  wrapInLayout: boolean;
  audienceConfig: EmailCampaignAudienceConfigMap | null;
  createdBy: number | null;
  createdAt: string;
  updatedAt: string;
}

export interface EmailCampaignSendLog {
  id: number;
  templateId: number;
  sentByUserId: number;
  audienceType: string;
  entityId: number | null;
  recipientEmail: string;
  recipientName: string | null;
  subjectSnapshot: string;
  status: 'sent' | 'failed';
  errorMessage: string | null;
  createdAt: string;
  templateName: string;
}
