export interface client {
  id?: number;
  clientName: string;
  phone_number: string;
  email_id: string;
  createdAt: string;
  updatedAt: string | null;
  createdBy: {
    id: number;
  };
  updatedBy: { id: number } | null;
}

export interface ClientState {
  clients: client[];
  loading: boolean;
  error: string | null;
}
export interface CreateClient {
  id?: number | null;
  clientName: string;
  emailId?: string;
  spocContactNumber?: string;
  spocName?: string;
  locations: string[] | null;
  createdBy: {
    id: number;
  };
}

export interface CreateClientUpload {
  id?: number | null;
  clientName: string;
  phoneNumber: string;
  emailId: string;
  createdBy: {
    id: number;
  };
  location: string;
}

export interface updateClientsPayload {
  id?: number;
  clientName: string;
  spocName?: string;
  spocContactNumber?: string;
  emailId?: string;
  updatedBy: {
    id: number;
  };
  locations: string[];
}

export interface FetchClient {
  id?: number;
  clientName: string;
  phoneNumber: string;
  emailId: string;
  updatedBy: { id: number } | null;
}
export interface CreateClientResponse {
  clientDetail: client;
}

export interface ClientUpdatePayload {
  client_name: string;
  phone_number: string;
  email_id: string;
  updatedBy: {
    id: number;
  };
  createdAt: string | null;
}


export interface ClientProfile {
  id: number;
  clientName: string;
  phoneNumber: string;
  emailId: string;
  createdAt: string;
  updatedAt: string;
}

export interface Clients {
  id: number;
  location: string;
  clientProfile: ClientProfile;
  createdAt: string;
  updatedAt: string;
  createdBy: { id: number };
  updatedBy: null | { id: number };
}