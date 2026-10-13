export interface location {
  locationName: string | null;
  id: number | null;
  location_name: string;
  country: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface updateLocationPayload {
  locationName: string;
  country: string;
  updatedBy: {
    id: number;
  };
}

export interface createLocationPayload {
  locationName: string;
  country: string;
  createdBy: {
    id: number;
  };
}
export interface locationDetails {
  id?: number;
  location_name: string;
  country: string;
  updatedBy: { id: number } | null;
}

export interface editLocation {
  id: number | null;
  locationName: string;
  country: string;
  updatedBy: { id: number } | null;
}
export interface LocationState {
  locations: location[];
  loading: boolean;
  error: string | null;
}
