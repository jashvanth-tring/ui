// Updated client-location.types.ts to match the required payload structure

export interface clientLocation {
  id?: number;
  location: number;
  client: number;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface clientLocationPayload {
  location: number;
  client: number;
  createdBy: {
    id: number;
  };
}

export interface clientLocationdetailPayload {
  id?: number;
  location: number;
  clientProfile: {
    id: number;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface createClientLocationPayload {
  clientProfile: {
    id: number;
  };
  location: {
    id: number;
  };
  createdBy: {
    id: number;
  };
  //eslint-disable-next-line
  updatedBy?: Record<string, any>;
}

export interface ClientLocationState {
  clientLocations: clientLocation[];
  loading: boolean;
  error: string | null;
}
export interface updateLocation {
  id: number | null;
  locationName: string;
  country: string;
}

export interface fetchLocation {
  id?: number;
  location: {
    locationName: string;
  };
  clientProfile: {
    clientName: string;
  };
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}
