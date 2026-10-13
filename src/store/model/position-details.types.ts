export interface PositionPayload {
  positionName: string;
  description: string;
  createdBy: {
    id: number;
  };
}

export interface PositionUpdatePayload {
  positionName: string;
  description: string;
  updatedBy: {
    id: number;
  };
}

export interface PositionDetails {
  id: number;
  positionName: string;
  description?: string | null;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface PositionDetailsState {
  positions: PositionDetails[];
  loading: boolean;
  error: string | null;
}

export interface Position {
  id: number;
  positionName: string;
  description?: string;
}
