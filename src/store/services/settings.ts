import { axiosInstance } from '../axiosSetup';
import { ApiVersions } from '../endpoints';

const base = `${ApiVersions.V1}/settings`;

export interface GapCategoryMappingRow {
  statusId: number;
  statusName: string;
  categoryIds: number[];
  hasDatabaseOverride: boolean;
}

export interface GapCategoryOption {
  id: number;
  name: string;
}

/** Mirrors API `categoryGroups`: categories bucketed by gap analysis type for the settings UI. */
export interface GapCategoryGroup {
  key: string;
  analysisType: number | null;
  label: string;
  description?: string;
  categories: GapCategoryOption[];
}

export interface GapMappingsResponse {
  success: boolean;
  data: GapCategoryMappingRow[];
  categories: GapCategoryOption[];
  categoryGroups?: GapCategoryGroup[];
}

export const fetchGapCategoryMappings = () =>
  axiosInstance.get<GapMappingsResponse>(`${base}/gap-category-mappings`);

export interface PipelineCountsResponse {
  success: boolean;
  data: Record<string, number>;
}

export const fetchPipelineCountsByStatus = () =>
  axiosInstance.get<PipelineCountsResponse>(`${base}/pipeline-counts-by-status`);

export const saveGapCategoryMappings = (updates: { statusId: number; categoryIds: number[] }[]) =>
  axiosInstance.put(`${base}/gap-category-mappings`, { updates });
