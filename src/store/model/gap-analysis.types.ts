import { client } from './client.types';

export interface gap_analysis_1 {
  id?: number;
  client_id: {
    id: number;
  };
  no_of_profile_shared: number;
  no_of_profile_rejects: number;
  duplicate: number;
  feedback_pending_from_client: number;
  candidate_dropped_out: number;
  interview_slot_issue: number;
  position_freeze_lost: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
export interface gap_analysis_2 {
  id?: number;
  client_id: {
    id: number;
  };
  no_of_profile_shared: number;
  no_of_interview_select: number;
  not_offered: number;
  on_progress: number;
  yet_to_offer: number;
  second_level_rejection: number;
  final_level_reject: number;
  hr_reject: number;
  negotiation_failure: number;
  candidate_dropped_out: number;
  position_freeze_lost: number;
  other_reason: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
export interface gap_analysis_3 {
  id?: number;
  client_id: {
    id: number;
  };
  no_of_profile_shared: number;
  no_of_offered: number;
  yet_to_join: number;
  joined: number;
  no_of_candidate_not_joined: number;
  got_another_offer: number;
  not_happy_with_the_company: number;
  not_happy_with_client: number;
  location_constraint: number;
  notice_period_constraint: number;
  salary_issue: number;
  other_reason: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface GapState {
  gap_analysis_1: gap_analysis_1[];
  gap_analysis_2: gap_analysis_2[];
  gap_analysis_3: gap_analysis_3[];
  client_wise_data: ClientWiseData[];
  weekly_data: WeeklyData[];
  loading: boolean;
  error: string | null;
}

export interface ClientWiseData {
  clientId: number;
  clientName: string;
  positions: PositionData[];
}

export interface PositionData {
  postionId: number;
  positionName: string;
  categories: CategoriesData[];
}

export interface WeeklyData {
  weekStart: string;
  weekEnd: string;
  categories: CategoriesData[];
}

export interface CategoriesData {
  id: number;
  categoryName: string;
  count: number;
  statuses: Statuses[];
}

export interface Statuses {
  id: number;
  statusName: string;
  count: number;
}

export interface updateGapPayload {
  client: client;
  oldStatus: number;
  newStatus: number;
  candidate: {
    id: number;
  };
  updatedBy: {
    id: number;
  };
}

export interface updateGapTwoPayload {
  client: client;
  oldStatus: string;
  newStatus: string;
  updatedBy: {
    id: number;
  };
}

export interface updateGapThreePayload {
  client: client;
  oldStatus: string;
  newStatus: string;
  updatedBy: {
    id: number;
  };
}
