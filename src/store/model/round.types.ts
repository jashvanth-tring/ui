import { FeedbackRow } from '../model/feedbackTracker.types';
export interface Round {
  id: number;
  roundName: string;
  feedBack: string;
  candidateId: string;
  interview_date: string;
  positionId: string;
  createdAt: string;
  updatedAt: string | null;
  isComplete: boolean;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface CreateRound {
  id?: number;
  roundName: string;
  feedBack: string;
  candidate: {
    id: number;
  };
  interviewDate: string;
  position: {
    id: number;
  };
  createdBy: {
    id: number;
  };
}

export interface UpdateRound {
  id?: number;
  roundName: string;
  feedBack: string;
  candidate: {
    id: number;
  };
  interviewDate: string;
  position: {
    id: number;
  };
  complete: boolean;
  updatedBy: { id: number } | null;
}

export interface RoundState {
  rounds: Round[];
  loading: boolean;
  error: string | null;
  feedbackRows: FeedbackRow[];
  feedbackLoading: boolean;
  feedbackError: string | null;
}

// Rename the local RoundDetails interface
export interface RoundDetailsLocal {
  id: number;
  roundName: string;
  feedBack: string;
  candidate: {
    id: number;
    candidateName: string;
  };
  interviewDate: string;
  position: {
    id: number;
    positionName: string;
  };
  complete: boolean;
}

/** Dashboard row from GET /v1/rounds/upcoming-interviews */
export interface UpcomingInterviewRow {
  roundId: number;
  /** Present on API v1 from 2026-04; optional for older cached responses */
  candidateId?: number;
  candidateName: string;
  clientOrAccountName: string;
  positionName: string;
  interviewType: string;
  level: string;
  interviewAt: string;
  dayLabel: string;
  recruiterName: string;
  location?: string;
  createdBy?: string;
}

export type InterviewFilter = 'today' | 'upcoming' | 'unhandled';
