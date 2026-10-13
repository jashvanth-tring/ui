import { axiosInstance } from '../axiosSetup';
import { ApiVersions } from '../endpoints';
import { EmailCampaignRoutes } from '../endpoints';
import type {
  EmailCampaignAudience,
  EmailCampaignTemplate,
} from '../model/email-campaign.types';
import type { CampaignRecipientRefPayload } from '../model/email-campaign-picker.types';

const base = `${ApiVersions.V1}${EmailCampaignRoutes.BASE}`;

export const listEmailCampaignTemplates = () =>
  axiosInstance.get<EmailCampaignTemplate[]>(base);

export const getEmailCampaignTemplate = (id: number) =>
  axiosInstance.get<EmailCampaignTemplate>(`${base}/${id}`);

export interface SaveTemplatePayload {
  name: string;
  description?: string | null;
  subjectTemplate: string;
  bodyHtml: string;
  wrapInLayout?: boolean;
  audienceConfig?: EmailCampaignTemplate['audienceConfig'];
}

export const createEmailCampaignTemplate = (payload: SaveTemplatePayload) =>
  axiosInstance.post<EmailCampaignTemplate>(base, payload);

export const updateEmailCampaignTemplate = (
  id: number,
  payload: Partial<SaveTemplatePayload>,
) => axiosInstance.patch<EmailCampaignTemplate>(`${base}/${id}`, payload);

export const deleteEmailCampaignTemplate = (id: number) =>
  axiosInstance.delete(`${base}/${id}`);

export const previewEmailCampaign = (payload: {
  templateId: number;
  audienceType: EmailCampaignAudience;
  /** Prefer recipientEmail in the UI; entityId still supported for API callers */
  entityId?: number;
  recipientEmail?: string;
  ccRecipients?: CampaignRecipientRefPayload[];
  bccRecipients?: CampaignRecipientRefPayload[];
  /** Merged on top of template static merge for this preview (e.g. positionTitle) */
  mergeOverrides?: Record<string, string>;
}) =>
  axiosInstance.post<{
    to: string;
    subject: string;
    html: string;
    ccResolved?: string[];
    bccResolved?: string[];
  }>(`${base}/preview`, payload);

export const sendEmailCampaign = (payload: {
  templateId: number;
  audienceType: EmailCampaignAudience;
  entityIds: number[];
  ccRecipients?: CampaignRecipientRefPayload[];
  bccRecipients?: CampaignRecipientRefPayload[];
  dryRun?: boolean;
  /** Per-send variables for Handlebars (overrides template static merge for this batch) */
  mergeOverrides?: Record<string, string>;
}) =>
  axiosInstance.post<{
    dryRun: boolean;
    results: { entityId: number; status: string; error?: string }[];
  }>(`${base}/send`, payload);

export const listEmailCampaignLogs = (templateId?: number, limit = 100) =>
  axiosInstance.get(`${base}/send-logs`, {
    params: { templateId, limit },
  });
