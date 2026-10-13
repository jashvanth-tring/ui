export interface candidateProfile {
  primaryContact: string;
  id: number | null;
  source: string;
  date: string;
  candidateName: string;
  phoneNo: string;
  emailId: string;
  currentLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: string;
  remarks?: string;
  isArchived?: boolean;
  resumeS3Key?: string | null;
}

export interface createCandidateProfile {
  profileSharedDate?: string | null; 
  // eslint-disable-next-line
  [x: string]: any;
  id?: number;
  source: string;
  date?: string;
  candidateName: string;
  primaryContact: string;
  emailId: string;
  candidateLocation?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  totalExp?: string;
  relExp?: string;
  skillSet?: string;
  sourceDate?: string;
  remarks?: string;
  uploadedBy: {
    id: number;
    firstName?: string;
    lastName?: string;
    officialEmail?: string;
  };
  createdBy: {
    id: number;
  };
}

export interface candidateProfileDetails {
  id: number | null;
  source: string;
  date: string;
  candidateName: string;
  primaryContact: string;
  emailId: string;
  candidateLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: string;
  csalary: string;
  esalary: string;
  noticeperiod: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
  remarks?: string;
  isArchived?: boolean;
  createdAt: string | null;
  resumeS3Key?: string | null;
  createdBy: {
    id: number;
  };
}

export interface CandidateProfileLoop {
  id?: number;
  source: string;
  date: string;
  candidateName: string;
  primaryContact: string;
  emailId: string;
  candidateLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: string;
  remarks?: string;
  createdBy: {
    id: number;
  };
  createdAt: string | null;
}

export interface UpdateCandidateProfile {
  source?: string;
  date?: string;
  candidateName?: string;
  primaryContact?: string;
  emailId?: string;
  candidateLocation?: string;
  totalExp?: string;
  relExp?: string;
  skillSet?: string;
  expectedSalary?: string;
  currentSalary?: string;
  noticePeriod?: string;
  remarks?: string;
  resumeS3Key?: string;
  sourceDate?: string;
  dateOfJoining?: string;
  updatedBy: {
    id: number;
  };
}

export interface filtercandidate {
  candidateName: {
    id: number;
  };
}

export interface candidateType {
  id?: number;
  source: string;
  date: string;
  candidateName: string;
  primaryContact: string;
  emailId: string;
  candidateLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: string;
  remarks?: string;
  createdBy: {
    id: number;
  };
}

export interface UpdateCandidatePayload {
  id?: number;
  source?: string;
  date?: string;
  candidateName?: string;
  primaryContact?: string;
  emailId?: string;
  candidateLocation?: string;
  totalExp?: string;
  relExp?: string;
  skillSet?: string;
  remarks?: string;
  updatedBy: {
    id: number;
  };
}

export interface PipelineClient {
  id: number;
  clientName: string;
  spocName: string;
  spocContactNumber: string;
  emailId: string;
}

export interface PipelinePosition {
  id: number;
  positionDetails: {
    id: number;
    positionName: string;
  };
}

export interface PipelineEntry {
  id: number;
  round: string;
  status: string;
  changedFields: string[] | null;
  createdAt: string;
  updatedAt: string;
  client: PipelineClient;
  position: PipelinePosition;
  createdBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
  updatedBy: {
    id: number;
    firstName: string;
    lastName: string;
  };
}

// ─── New History API Types ────────────────────────────────────────
export interface HistoryChangedFields {
  before: Record<string, any> | null;
  after: Record<string, any>;
}

export interface CandidateStatusHistoryEntry {
  id: number;
  candidateStatusId: number;
  candidateId: number;
  requirementId: number;
  operation: 'CREATE' | 'UPDATE';
  changedFields: HistoryChangedFields;
  changedAt: string;
  changedBy: number;
  changedByName: string | null;
  // Enriched by API join
  clientName: string;
  positionName: string;
}

export interface CandidateProfileHistoryEntry {
  id: number;
  candidateId: number;
  operation: 'CREATE' | 'UPDATE' | 'ARCHIVE';
  changedFields: HistoryChangedFields;
  changedAt: string;
  changedBy: number;
  changedByName: string | null;
}

export interface HistoryPage<T> {
  data: T[];
  nextCursor: string | null;
  hasMore: boolean;
}

export interface ParsedResumeData {
  name: string;
  email: string;
  phone: string;
  location: string;
  totalExperience: string;
  relevantExperience: string;
  skills: string;
  confidence: Record<string, number>;
  parsedBy: string;
}

export interface ParsedResumeResponse {
  parsedData: ParsedResumeData;
  existingCandidate: any | null;
  existingMappings: any[];
  /** Set when API uploaded the file to S3 */
  resumeS3Key?: string;
}

export interface CandidateState {
  candidates: candidateProfile[];
  currentCandidate: candidateProfileDetails | null;
  loading: boolean;
  error: string | null;
  pipeline: PipelineEntry[];
  pipelineLoading: boolean;
  parsedResume: ParsedResumeResponse | null;
  parseLoading: boolean;
  // New history
  statusHistory: CandidateStatusHistoryEntry[];
  statusHistoryNextCursor: string | null;
  statusHistoryHasMore: boolean;
  statusHistoryLoading: boolean;
  profileHistory: CandidateProfileHistoryEntry[];
  profileHistoryNextCursor: string | null;
  profileHistoryHasMore: boolean;
  profileHistoryLoading: boolean;
}
