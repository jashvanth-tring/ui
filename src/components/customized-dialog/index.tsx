import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogProps,
  useMediaQuery,
  ThemeProvider,
  createTheme,
  Theme,
  SxProps,
  IconButton,
} from '@mui/material';
import ButtonGroup from '../customized-button';
import CloseIcon from '@mui/icons-material/Close';

interface CustomDialogProps extends Partial<Omit<DialogProps, 'title' | 'content'>> {
  open: boolean;
  onClose: () => void;
  title?: React.ReactNode;
  content?: React.ReactNode;
  actions?: React.ReactNode;
  fullWidth?: boolean;
  maxWidth?: DialogProps['maxWidth'];
  fullScreen?: boolean;
  disableEscapeKeyDown?: boolean;
  dialogTitleProps?: SxProps<Theme>;
  dialogContentProps?: SxProps<Theme>;
  dialogActionsProps?: SxProps<Theme>;
  confirmButtonText?: string;
  cancelButtonText?: string;
  onConfirm?: () => void;
  showDefaultActions?: boolean;
  dialogPaperProps?: SxProps<Theme>;
}

const CustomDialog: React.FC<CustomDialogProps> = ({
  open,
  onClose,
  title,
  content,
  actions,
  fullWidth = true,
  maxWidth = 'md',
  fullScreen: propFullScreen,
  ...props
}) => {
  const theme = createTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('md'));
  const fullScreen = propFullScreen ?? isSmallScreen;

  return (
    <ThemeProvider theme={theme}>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth={fullWidth}
        maxWidth={maxWidth}
        fullScreen={fullScreen}
         style={{ zIndex: 10000 }}
        PaperProps={{
          sx: {
            borderRadius: fullScreen ? 0 : 2,
            ...props.dialogPaperProps,
          },
        }}
        {...props}
      >
        {title && (
          <DialogTitle
            sx={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              paddingX: 2,
              paddingY: 1,
              fontSize: 20,
              ...props.dialogTitleProps,
            }}
          >
            {title}
            <IconButton
              onClick={onClose}
              sx={{
                padding: 0.5,
                '&:hover': {
                  borderRadius: '50%',
                },
              }}
            >
              <CloseIcon sx={{ fontSize: 20 }} />
            </IconButton>
          </DialogTitle>
        )}

        {content && (
          <DialogContent
            dividers
            sx={{ display: 'flex', flexDirection: 'column', gap: 2, ...props.dialogContentProps }}
          >
            {content}
          </DialogContent>
        )}
        {(actions || props.showDefaultActions) && (
          <DialogActions sx={props.dialogActionsProps}>
            <ButtonGroup
              confirmText={props.confirmButtonText || 'Confirm'}
              cancelText={props.cancelButtonText || 'Cancel'}
              onCancel={onClose}
              onConfirm={props.onConfirm}
            />
          </DialogActions>
        )}
      </Dialog>
    </ThemeProvider>
  );
};

export default CustomDialog;
