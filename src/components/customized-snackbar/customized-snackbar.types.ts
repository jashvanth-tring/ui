export interface CustomizedSnackbarsProps {
  open: boolean;
  handleClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  onClose?: (event?: React.SyntheticEvent | Event, reason?: string) => void;
  message: string;
  severity: 'success' | 'info' | 'warning' | 'error';
}
