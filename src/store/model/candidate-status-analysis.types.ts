export interface CandidateStatusAnalysis {
  id: number | null;
  client: number;
  count: number;
  status: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
export interface CandidateStatusAnalysisState {
  candidateStatus: CandidateStatusAnalysis[];
  loading: boolean;
  error: string | null;
}

export interface CandidateStatusAnalysisLoop {
  id: number | null;
  client: number;
  count: number;
  status: {
    id: number;
    statusName: string;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
