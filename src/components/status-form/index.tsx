import { useEffect, useState } from 'react';
import { useForm, Controller } from 'react-hook-form';
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from 'yup';
import {
  Card,
  CardContent,
  Typography,
  TextField,
  Button,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  FormHelperText,
  IconButton,
  Box,
  Stack,
  Paper,
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, Delete as DeleteIcon } from '@mui/icons-material';
import {
  ApiResponse,
  CategoryFormData,
  StatusCategory,
  StatusCategoryPayload,
  StatusCategoryUpdatePayload,
  StatusData,
  StatusFormData,
  StatusPayload,
} from '../../store/model';
import { useAppSelector, useDispatch } from '../../store';
import { getLoggedInUserDetails } from '../../utils/logged-user-details';
import {
  createStatusCategory,
  deleteStatusCategory,
  fetchStatusCategories,
  updateStatusCategory,
} from '../../store/action/status-category.action';
import { HttpStatusCode } from '../../constants';
import CustomizedSnackbars from '../customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { RootState } from '../../store/reducers';
import ConfirmationDialog from '../confirmation-dialog';
import { createStatus, fetchStatus } from '../../store/action/status.action';

const statusSchema = yup.object().shape({
  statusName: yup.string().required('Status name is required'),
  categoryId: yup.number().typeError('Category is required').required('Category is required'),
});

const categorySchema = yup.object().shape({
  categoryName: yup.string().required('Category name is required'),
});

const StatusForm: React.FC = () => {
  const user = useAppSelector(getLoggedInUserDetails);
  const dispatch = useDispatch();

  const { statusCategory } = useAppSelector((state: RootState) => state?.statusCategoriesSelector);
  const {
    snackbarState,
    showSuccessSnackbar,
    showErrorSnackbar,
    showWarningSnackbar,
    handleSnackbarClose,
  } = useSnackbar();

  useEffect(() => {
    dispatch(fetchStatusCategories());
  }, []);
  useEffect(() => {
    dispatch(fetchStatus());
  }, []);

  const [showCategoryForm, setShowCategoryForm] = useState(false);
  const [editingCategory, setEditingCategory] = useState<StatusCategory | null>(null);

  const [deleteId, setDeleteId] = useState(0);

  const {
    control: statusControl,
    handleSubmit: handleStatusSubmit,
    reset: resetStatusForm,
  } = useForm<StatusFormData>({
    resolver: yupResolver(statusSchema),
    defaultValues: {
      statusName: '',
      categoryId: 0,
    },
    mode: 'all',
  });

  const {
    control: categoryControl,
    handleSubmit: handleCategorySubmit,
    reset: resetCategoryForm,
  } = useForm<CategoryFormData>({
    resolver: yupResolver(categorySchema),
    defaultValues: {
      categoryName: '',
    },
    mode: 'all',
  });
  const onStatusSubmit = async (data: StatusFormData) => {
    try {
      const statusData: StatusPayload = {
        statusName: data.statusName,
        createdBy: {
          id: user?.id,
        },
      };
      const response: ApiResponse<StatusData> = await dispatch(createStatus(statusData)).unwrap();

      if (response.success && response.statusCode === HttpStatusCode.CREATED) {
        showSuccessSnackbar(response?.message ?? 'Status created successfully!');
        resetStatusForm();
      } else if (response.statusCode === HttpStatusCode.CONFLICT) {
        showWarningSnackbar(
          response?.message ?? 'Status already exists! Please enter another status.'
        );
      } else {
        showErrorSnackbar(response?.message || 'Failed to create status');
      }
    } catch (e) {
      console.error(e);
      showErrorSnackbar('An error occurred while creating the status');
    }
  };
  const onCategorySubmit = async (data: CategoryFormData) => {
    try {
      const statusCategoryPayload: StatusCategoryPayload = {
        categoryName: data.categoryName,
        createdBy: {
          id: user?.id,
        },
      };
      const response: ApiResponse<StatusCategory> = await dispatch(
        createStatusCategory(statusCategoryPayload)
      ).unwrap();

      if (response?.success && response?.statusCode === HttpStatusCode.CREATED) {
        showSuccessSnackbar(response?.message ?? 'Category created successfully!');
        resetCategoryForm();
        setShowCategoryForm(false);
      } else if (response?.statusCode === HttpStatusCode.CONFLICT) {
        showWarningSnackbar(
          response?.message ?? 'Status Category already exists! Please enter another category!'
        );
      } else {
        showErrorSnackbar(response?.message || 'Failed to create category');
      }
    } catch (e) {
      console.error(e);
      showErrorSnackbar('An error occurred while creating the category');
    }
  };

  const handleUpdateCategory = async () => {
    if (!editingCategory) return;

    try {
      const statusCategoryPayload: StatusCategoryUpdatePayload = {
        categoryName: editingCategory.categoryName,
        updatedBy: {
          id: user?.id,
        },
      };

      const response: ApiResponse<StatusCategory> = await dispatch(
        updateStatusCategory({
          statusCategoryId: editingCategory.id,
          payload: statusCategoryPayload,
        })
      ).unwrap();

      const { success, statusCode, message } = response;

      if (success && statusCode === HttpStatusCode.OK) {
        showSuccessSnackbar(message || 'Category updated successfully!');
        setEditingCategory(null);
      } else if (statusCode === HttpStatusCode.CONFLICT) {
        showWarningSnackbar(
          message ?? 'Status Category already exists! Please enter another category!'
        );
      } else {
        showErrorSnackbar(response.message || 'Failed to update category');
      }
    } catch (error) {
      console.log(error);
      showErrorSnackbar('An error occurred while updating the category');
    }
  };

  const handleEditCategory = (category: StatusCategory) => {
    setEditingCategory(category);
  };

  const handleDeleteCategory = async (statusCategoryId: number) => {
    setDeleteId(statusCategoryId);
  };

  const handleConfirm = async () => {
    try {
      const response: ApiResponse<StatusCategory> = await dispatch(
        deleteStatusCategory(deleteId)
      ).unwrap();
      if (response.statusCode === HttpStatusCode.OK) {
        showSuccessSnackbar('Category deleted successfully!');
      }
      const { success, statusCode, message } = response;

      if (success && statusCode === HttpStatusCode.OK) {
        showSuccessSnackbar(message || 'Category deleted successfully!');
        setDeleteId(0);
      } else if (statusCode === HttpStatusCode.CONFLICT) {
        showWarningSnackbar(message ?? 'Category Mapped to status and hence cannot be deleted!');
      } else {
        showErrorSnackbar(response?.message || 'Failed to update category');
      }
    } catch (error) {
      console.log(error);
      showErrorSnackbar('Failed to delete category');
    }
  };

  return (
    <>
      <Stack spacing={3}>
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom className="spoyyer">
              Create Status
            </Typography>
            <form onSubmit={handleStatusSubmit(onStatusSubmit)}>
              <Stack spacing={3}>
                <Controller
                  name="statusName"
                  control={statusControl}
                  render={({ field, fieldState }) => (
                    <TextField
                      {...field}
                      label="Status Name"
                      fullWidth
                      error={!!fieldState.error}
                      helperText={fieldState.error?.message}
                    />
                  )}
                />

                <Box sx={{ display: 'flex', gap: 2 }}>
                  <Controller
                    name="categoryId"
                    control={statusControl}
                    render={({ field, fieldState }) => (
                      <FormControl error={!!fieldState.error} sx={{ width: '90%' }}>
                        <InputLabel>Category</InputLabel>
                        <Select
                          {...field}
                          label="Category"
                          onChange={(e) => field.onChange(Number(e.target.value))}
                        >
                          {statusCategory?.length > 0 ? (
                            statusCategory?.map((category: StatusCategory) => (
                              <MenuItem key={category.id} value={category.id.toString()}>
                                {category.categoryName}
                              </MenuItem>
                            ))
                          ) : (
                            <MenuItem>No Found</MenuItem>
                          )}
                        </Select>
                        {fieldState.error && (
                          <FormHelperText>{fieldState.error.message}</FormHelperText>
                        )}
                      </FormControl>
                    )}
                  />
                  <Button
                    variant="outlined"
                    startIcon={<AddIcon />}
                    onClick={() => setShowCategoryForm(true)}
                  >
                    Add Category
                  </Button>
                </Box>

                <Button variant="contained" type="submit">
                  Create Status
                </Button>
              </Stack>
            </form>
          </CardContent>
        </Card>

        {showCategoryForm && (
          <Card>
            <CardContent>
              <Typography variant="h6" gutterBottom>
                Add Category
              </Typography>
              <form onSubmit={handleCategorySubmit(onCategorySubmit)}>
                <Stack spacing={3}>
                  <Controller
                    name="categoryName"
                    control={categoryControl}
                    render={({ field, fieldState }) => (
                      <TextField
                        {...field}
                        label="Category Name"
                        fullWidth
                        error={!!fieldState.error}
                        helperText={fieldState.error?.message}
                      />
                    )}
                  />
                  <Box sx={{ display: 'flex', gap: 2 }}>
                    <Button variant="contained" type="submit">
                      Add Category
                    </Button>
                    <Button
                      variant="outlined"
                      onClick={() => {
                        setShowCategoryForm(false);
                        resetCategoryForm();
                      }}
                    >
                      Cancel
                    </Button>
                  </Box>
                </Stack>
              </form>
            </CardContent>
          </Card>
        )}

        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom className="spoyyer">
              Categories
            </Typography>
            <Stack spacing={2}>
              {statusCategory?.map((category: StatusCategory) => (
                <Paper
                  key={category.id}
                  sx={{
                    p: 2,
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                  }}
                >
                  {editingCategory?.id === category.id ? (
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flexGrow: 1 }}>
                      <TextField
                        value={editingCategory.categoryName}
                        onChange={(e) =>
                          setEditingCategory({ ...editingCategory, categoryName: e.target.value })
                        }
                        fullWidth
                        variant="outlined"
                      />
                      <Button
                        variant="contained"
                        onClick={handleUpdateCategory}
                        disabled={!editingCategory.categoryName.trim()}
                      >
                        Save
                      </Button>
                      <Button variant="outlined" onClick={() => setEditingCategory(null)}>
                        Cancel
                      </Button>
                    </Box>
                  ) : (
                    <>
                      <Typography>{category.categoryName}</Typography>
                      <Box sx={{ display: 'flex', gap: 1 }}>
                        <IconButton size="small" onClick={() => handleEditCategory(category)}>
                          <EditIcon />
                        </IconButton>
                        <IconButton size="small" onClick={() => handleDeleteCategory(category.id)}>
                          <DeleteIcon />
                        </IconButton>
                      </Box>
                    </>
                  )}
                </Paper>
              ))}
            </Stack>
          </CardContent>
        </Card>
      </Stack>
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
      <ConfirmationDialog
        open={deleteId ? true : false}
        onClose={() => setDeleteId(0)}
        title="Delete Item"
        description="Are you sure you want to delete this item? This action cannot be undone."
        confirmText="Delete"
        cancelText="Cancel"
        onConfirm={handleConfirm}
        variant="destructive"
      />
    </>
  );
};

export default StatusForm;
