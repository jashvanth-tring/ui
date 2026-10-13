export interface CandidateStatusListCandidate {
  id: number;
  candidateName: string;
  emailId: string;
  primaryContact: string;
  candidateLocation: string;
  source?: string;
  relExp?: number;
  totalExp?: number;
  skillSet?: string;
  noticePeriod?: string;
}

export interface CandidateStatusListClient {
  id: number;
  clientName: string;
  spocName?: string;
  emailId?: string;
}

export interface CandidateStatusListPosition {
  id: number;
  positionName: string;
  description: string | null;
}

export interface CandidateStatusListStatus {
  id: number;
  statusName: string;
}

/** User stub from API (password etc. omitted from typing). */
export interface CandidateStatusListActor {
  id: number;
  firstName?: string | null;
  lastName?: string | null;
  officialEmail?: string | null;
}

export interface CandidateStatusListItem {
  id:                  number;
  profileSharedDate: string | null;
  remarks?:            string | null;
  createdAt?:          string;
  updatedAt?:          string;
  candidate?: {
    id?:               number;
    candidateName?:    string;
    emailId?:          string;
    primaryContact?:   string;
    candidateLocation?: string;
    relExp?:           string;
    totalExp?:         string;
    date?:             string;
  };
  client?: {
    id?:               number;
    clientName?:       string;
    spocName?:         string;
    spocContactNumber?: string;
    emailId?:          string;
  };
  requirementDetails?: {           // ← root level field
    id?:               number;
    noOfPosition?:     number;
    skillSet?:         string[];
    relExp?:           number;
    openDate?:         string;
    positionDetails?: {            // ← nested inside
      id?:             number;
      positionName?:   string;
    };
    client?: {                     // ← also joined (requirementDetails.client)
      id?:             number;
      clientName?:     string;
    };
  };
  status?: {
    id?:               number;
    statusName?:       string;
    createdAt?:        string;
    updatedAt?:        string;
  };
  createdBy?: {
    id?:               number;
    firstName?:        string;
    lastName?:         string;
    officialEmail?:    string;
    primaryPhone?:     string | null;
  };

  assignedTo?: {
    id?: number;
    firstName?: string;
    lastName?: string;
    officialEmail?: string;
  };
  
  updatedBy?: {
    id?:               number;
    firstName?:        string;
    lastName?:         string;
    officialEmail?:    string;
    primaryPhone?:     string | null;
  };
}

export interface CandidateStatusListPagination {
  total: number;
  page: number;
  limit: number;
  totalPages: number;
  hasMore: boolean;
}

export interface CandidateStatusListApiBody {
  success: boolean;
  message: string;
  data: CandidateStatusListItem[];
  pagination?: CandidateStatusListPagination;
}

// ─── Aggregates (left panel: candidates per requirement) ─────────────────────

export interface AggregateItem {
  clientId: number;
  clientName: string;
  requirementId: number;
  positionName: string;
  count: number;
}

export interface AggregatesApiBody {
  success: boolean;
  message: string;
  data: AggregateItem[];
}

// ─── Filter options (dropdown population) ────────────────────────────────────

export interface FilterOptionsData {
  clients:      { id: number; clientName: string }[];
  requirements: { id: number; positionName: string }[];
  statuses:     { id: number; statusName: string }[];
}

export interface FilterOptionsApiBody {
  success: boolean;
  message: string;
  data: FilterOptionsData;
}

