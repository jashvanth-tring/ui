export interface AddClientFormData {
  clientName: string;
  emailId: string;
  spocName: string;
  spocContactNumber: string;
  locations: string[];
}

export interface AddClientFormErrors {
  clientName: string;
  spocName: string;
  spocContactNumber: string;
  locations: string;
}

export const EMPTY_CLIENT_ERRORS: AddClientFormErrors = {
  clientName: "",
  spocName: "",
  spocContactNumber: "",
  locations: "",
};

export type Option = {
  value: string;
  label: string;
};