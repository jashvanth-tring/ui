import { useState, useRef, useEffect } from 'react';
import type React from 'react';

export type SnackbarSeverity = 'success' | 'error' | 'info' | 'warning';

export interface SnackbarState {
  open: boolean;
  message: string;
  severity: SnackbarSeverity;
}

export interface UseSnackbarReturn {
  snackbarState: SnackbarState;
  showSnackbar: (
    message: string,
    severity?: SnackbarSeverity,
    duration?: number
  ) => void;
  showSuccessSnackbar: (message: string, duration?: number) => void;
  showErrorSnackbar: (message: string, duration?: number) => void;
  showInfoSnackbar: (message: string, duration?: number) => void;
  showWarningSnackbar: (message: string, duration?: number) => void;
  handleSnackbarClose: (
    event?: React.SyntheticEvent | Event,
    reason?: string
  ) => void;
}

const DEFAULT_DURATION = 4000;

export const useSnackbar = (): UseSnackbarReturn => {
  const [snackbarState, setSnackbarState] = useState<SnackbarState>({
    open: false,
    message: '',
    severity: 'info',
  });

  const timeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleSnackbarClose: UseSnackbarReturn['handleSnackbarClose'] = (
    _event,
    reason
  ) => {
    if (reason === 'clickaway') return;

    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
      timeoutRef.current = null;
    }

    setSnackbarState((previous) => ({
      ...previous,
      open: false,
    }));
  };

  const showSnackbar = (
    message: string,
    severity: SnackbarSeverity = 'info',
    duration: number = DEFAULT_DURATION
  ) => {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current);
    }

    setSnackbarState({ open: true, message, severity });

    timeoutRef.current = setTimeout(() => {
      setSnackbarState((previous) => ({
        ...previous,
        open: false,
      }));
      timeoutRef.current = null;
    }, duration);
  };

  const showSuccessSnackbar = (message: string, duration?: number) =>
    showSnackbar(message, 'success', duration);

  const showErrorSnackbar = (message: string, duration?: number) =>
    showSnackbar(message, 'error', duration);

  const showInfoSnackbar = (message: string, duration?: number) =>
    showSnackbar(message, 'info', duration);

  const showWarningSnackbar = (message: string, duration?: number) =>
    showSnackbar(message, 'warning', duration);

  useEffect(() => {
    return () => {
      if (timeoutRef.current) {
        clearTimeout(timeoutRef.current);
      }
    };
  }, []);

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
