import React from 'react';
import Snackbar from '@mui/material/Snackbar';
import Alert from '@mui/material/Alert';
import Portal from '@mui/material/Portal';
import { CustomizedSnackbarsProps } from './customized-snackbar.types';

const severityColors: { [key: string]: string } = {
  success: '#A1D6B2', // Green
  info: '#2196f3', // Blue
  warning: '#fea621', // Orange
  error: '#E68369', // Red
};

const CustomizedSnackbars: React.FC<CustomizedSnackbarsProps> = ({
  open,
  handleClose: handleCloseProp,
  onClose,
  message,
  severity,
}) => {
  const handleClose = handleCloseProp ?? onClose;
  return (
    <Portal>
      <Snackbar
        open={open}
        autoHideDuration={4000}
        onClose={handleClose}
        anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
        sx={{
          zIndex: 99999,
          maxWidth: 'min(560px, calc(100vw - 32px))',
        }}
      >
        <Alert
          onClose={handleClose}
          severity={severity}
          variant="filled"
          sx={{
            width: '100%',
            backgroundColor: severityColors[severity],
            color: '#fff',
          }}
        >
          {message}
        </Alert>
      </Snackbar>
    </Portal>
  );
};

export default CustomizedSnackbars;
