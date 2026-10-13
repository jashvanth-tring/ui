export interface StatusCategory {
  id: number;
  categoryName: string;
}

export interface StatusFormData {
  statusName: string;
  categoryId: number;
}

export interface CategoryFormData {
  categoryName: string;
}

export interface StatusCategoryPayload {
  categoryName: string;
  createdBy: {
    id: number;
  };
}

export interface StatusCategoryUpdatePayload {
  categoryName: string;
  updatedBy: {
    id: number;
  };
}

// export interface Status {
//   id: number;
//   categoryName: string;
//   status: StatusData[];
// }

export interface StatusData {
  id: number;
  statusName: string;
  createdAt: string | null;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface StatusPayload {
  statusName: string;
  createdBy: {
    id: number;
  };
}

export interface StatusUpdatePayload {
  statusName: string;
  updatedBy: {
    id: number;
  };
}

export interface StatusState {
  status: StatusData[];
  loading: boolean;
  error: string | null;
}
