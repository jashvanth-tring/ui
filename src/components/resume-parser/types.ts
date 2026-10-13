export interface ParsedResume {
  candidateName: string;
  email: string;
  phone: string;
  location: string;
  totalExperience: string;
  relevantExperience: string;
  skillSet: string[];
  // ── recruiter fields ──
  dateOfJoining?: string;
  sourceDate?: string;
  source?: string;
  date?: string;
  currentSalary?: string;
  expectedSalary?: string;
  noticePeriod?: string;
  remarks?: string;
  requirementId?: string;
  candidateStatusId?: string;
  uploadedById?: string;

  // ── duplicate tracking ──
  existingCandidateId?: number;
  existingMappings?: any[];

  /** S3 key from POST /v1/candidates-profile/upload (saved on create/update) */
  resumeS3Key?: string;
}

export type ProcessingStage = "upload" | "extract" | "parse" | "entities" | "done" | "";