export type FeedbackRow = {
  sNo: number;
  roundId: number;
  candidateName: string;
  clientOrAccountName: string;
  positionName: string;
  interviewType: string;
  level: string;
  interviewAt: string;      
  dayLabel: string;
  recruiterName: string;
  feedBack: string;
  rejectReason: string | null;
  createdBy: string | null;
};