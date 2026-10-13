import { useState } from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export interface UseSnackbarReturn {
  snackbarState: SnackbarState;
  showSnackbar: (message: string, severity?: SnackbarSeverity, duration?: number) => void;
  showSuccessSnackbar: (message: string, duration?: number) => void;
  showErrorSnackbar: (message: string, duration?: number) => void;
  showInfoSnackbar: (message: string, duration?: number) => void;
  showWarningSnackbar: (message: string, duration?: number) => void;
  handleSnackbarClose: (event?: React.SyntheticEvent | Event, reason?: string) => void;
}

const DEFAULT_DURATION = 3000;

export const useSnackbar = (): UseSnackbarReturn => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'success',
  });

  let snackbarTimeout: NodeJS.Timeout;

  const handleSnackbarClose = (_event?: React.SyntheticEvent | Event, reason?: string) => {
    if (reason === 'clickaway') {
      return;
    }
    setSnackbarState((prev) => ({ ...prev, open: false }));
  };

  const showSnackbar = (
    message: string,
    severity: SnackbarSeverity = 'success',
    duration: number = DEFAULT_DURATION
  ) => {
    // Clear any existing timeout
    if (snackbarTimeout) {
      clearTimeout(snackbarTimeout);
    }

    setSnackbarState({
      open: true,
      message,
      severity,
    });

    // Auto hide after duration
    snackbarTimeout = setTimeout(() => {
      handleSnackbarClose();
    }, duration);
  };

  const showSuccessSnackbar = (message: string, duration?: number) => {
    showSnackbar(message, 'success', duration);
  };

  const showErrorSnackbar = (message: string, duration?: number) => {
    showSnackbar(message, 'error', duration);
  };

  const showInfoSnackbar = (message: string, duration?: number) => {
    showSnackbar(message, 'info', duration);
  };

  const showWarningSnackbar = (message: string, duration?: number) => {
    showSnackbar(message, 'warning', duration);
  };

  return {
    snackbarState,
    showSnackbar,
    showSuccessSnackbar,
    showErrorSnackbar,
    showInfoSnackbar,
    showWarningSnackbar,
    handleSnackbarClose,
  };
};

// Common snackbar messages
export const SNACKBAR_MESSAGES = {
  SUCCESS: {
    CREATE: 'Created successfully',
    UPDATE: 'Updated successfully',
    DELETE: 'Deleted successfully',
    SAVE: 'Saved successfully',
    AMENITY_GROUP_CREATE: 'Amenity created successfully',
    AMENITY_DELETE: 'Amenity deleted sucessfully',
    AMENITY_UPDATE: 'Amenity updated sucessfully',
    CODES_UPDATE: 'Property code updated successfully',
    CODES_DELETE: 'Property code deleted successfully',
    CATEGORY_CREATE: 'Category created successfully',
    CATEGORY_UPDATE: 'Category updated successfully',
    CATEGORY_DELETE: 'Category deleted successfully',
    SUBCATEGORY_CREATE: 'Sub category created sucessfully',
    SUBCATEGORY_DELETE: 'Sub category deleted sucessfully',
    SUBCATEGORY_UPDATE: 'Sub category updated sucessfully',
  },
  ERROR: {
    CREATE: 'Failed to create. Please try again',
    UPDATE: 'Failed to update. Please try again',
    DELETE: 'Failed to delete. Please try again',
    SAVE: 'Failed to save. Please try again',
    GENERAL: 'An error occurred. Please try again',
    DUPLICATE_HOLIDAY: 'Holiday already exists',
    DUPLICATE_HOLIDAY_DATE: 'An Holiday already exists in these dates ',
    MAPPED_AMENITY: 'Amenity cannot be deleted as it is mapped to a property',
    DUPLICATE_CATEGORY: 'Property code category already exists',
    DUPLICATE_CODE: 'Property code already exists for this property.',
    FAILED: 'Cannot upload more than 10 photos',
    USER_PROPERTY_DELETE: 'Property cannot be deleted as it has active booking.',
    IMAGE_UPLOAD: 'Unsupported file uploaded.',
  },
} as const;
