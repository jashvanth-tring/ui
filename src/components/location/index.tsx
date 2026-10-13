import React, { useEffect, useState, useMemo } from 'react';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { IconButton, TableCell, TextField } from '@mui/material';
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  Save as SaveIcon,
  Cancel as CancelIcon,
} from '@mui/icons-material';
import ConfirmationDialog from '../confirmation-dialog';
import { editLocation, locationDetails } from '../../store/model/location.types';
import {
  createLocation,
  deleteLocation,
  fetchAllLocation,
  updateLocation,
} from '../../store/action/location.action';
import { location } from '../../store/model/location.types';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import ReusableDataGrid from '../data-grid';
import { GridCellParams } from '@mui/x-data-grid';
import Select from 'react-select';
import countryList from 'react-select-country-list';
import { Plus } from 'lucide-react';

interface formData {
  location_name: string;
  country: string;
}
interface InlineEditing {
  id: number | null;
  location_name: string;
  country: string;
}

export default function Location() {
  const [formData, setFormData] = useState<formData>({
    location_name: '',
    country: '',
  });
  const {
    snackbarState,
    showSuccessSnackbar,
    showWarningSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackbar();
  const [errors, setError] = useState({
    location_name: '',
    country: '',
  });
  const [deletingLocationId, setDeletingLocationId] = useState<number>(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [inlineEditing, setInlineEditing] = useState<InlineEditing>({
    id: null,
    location_name: '',
    country: '',
  });
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { locations } = useAppSelector((state: RootState) => state?.locationsSelector) || {};
  const [value, setValue] = useState('');
  const options = useMemo(
    () =>
      countryList()
        .getData()
        .map((country) => ({ value: country.label, label: country.label })),
    []
  );
  // eslint-disable-next-line
  const changeHandler = (newValue: any) => {
    setValue(newValue ? newValue.value : '');
    setFormData({
      ...formData,
      country: newValue.value,
    });
  };

  //global states
  const dispatch = useDispatch();
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };
  const validateForm = () => {
    const errors: { location_name: string; country: string } = { location_name: '', country: '' };
    if (!formData.location_name) {
      errors.location_name = 'Please fill in the Location name';
    }
    if (!formData.country) {
      errors.country = 'Please fill in the country name';
    }

    setError(errors);
    return errors;
  };
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    const form_data = {
      locationName: formData.location_name,
      country: formData.country,
      createdBy: {
        id: user?.id,
      },
    };
    if (Object.values(error).some((value) => value !== '')) {
      setError(error);
      return;
    }
    setIsFormOpen(false);

    try {
      const response = await dispatch(createLocation(form_data)).unwrap();
      if (response?.success) {
        dispatch(fetchAllLocation());
        setFormData({
          location_name: '',
          country: '',
        });
        showSuccessSnackbar(response?.message ?? 'Location created successfully');
      } else {
        showWarningSnackbar(response?.message ?? `Location is already present`);
      }
    } catch (error) {
      console.error('Error creating location:', error);
      showErrorSnackbar('An error occurred while updating the location');
    }
  };
  const validateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    switch (name) {
      case 'location_name':
        if (value !== '') {
          setError((prevErrors) => ({
            ...prevErrors,
            location_name: '',
          }));
        }
        break;

      case 'country':
        if (value !== '') {
          setError((prevErrors) => ({
            ...prevErrors,
            country: '',
          }));
        }
        break;

      default:
        break;
    }
  };
  const handleInlineInputChange = (field: keyof locationDetails, value: string) => {
    setInlineEditing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };
  const startInlineEdit = (location: editLocation) => {
    setInlineEditing({
      id: location.id,
      location_name: location.locationName || '',
      country: location.country || '',
    });
  };
  const cancelInlineEdit = () => {
    setInlineEditing({
      id: null,
      location_name: '',
      country: '',
    });
  };
  const saveInlineEdit = async () => {
    if (inlineEditing.id) {
      try {
        const result = await dispatch(
          updateLocation({
            id: inlineEditing.id,
            payload: {
              locationName: inlineEditing.location_name,
              country: inlineEditing.country,
              updatedBy: { id: user?.id },
            },
          })
        ).unwrap();
        if (result.success) {
          dispatch(fetchAllLocation());
          showSuccessSnackbar('location updated successfully');
        }
        cancelInlineEdit();
      } catch (error) {
        console.error('Error updating location:', error);
        showErrorSnackbar('An error occurred while updating the location');
      }
    }
  };
  const handleDelete = async () => {
    if (deletingLocationId) {
      try {
        const result = await dispatch(deleteLocation(deletingLocationId)).unwrap();
        if (result?.success) {
          dispatch(fetchAllLocation());
          showSuccessSnackbar('Location deleted successfully');
          setConfirmDialogOpen(false);
          setDeletingLocationId(0);
        } else {
          showErrorSnackbar('An error occurred while deleting the location');
        }
      } catch (error) {
        console.error('Error deleting location:', error);
        showErrorSnackbar('An error occurred while deleting the location');
      }
    }
  };
  useEffect(() => {
    async function fetchLocation() {
      try {
        await dispatch(fetchAllLocation());
      } catch (error) {
        console.log(error);
      }
    }
    fetchLocation();
  }, [dispatch]);

  useEffect(() => {}, [inlineEditing]);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  //search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };
  const filteredLocation = locations?.filter((locationz: location) => {
    if (locationz && locationz?.locationName) {
      const query = searchQuery.toLowerCase();
      const mainlocation = locationz.locationName?.toLowerCase() || '';
      return mainlocation.includes(query);
    }
    return false;
  });
  const columns = [
    {
      field: 'locationName',
      headerName: 'Location Name',
      flex: 1,
      headerClassName: 'custom-header-class',
      cellClassName: 'custom-cell-class',
      renderCell: (params: GridCellParams) => {
        const location = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === location.id ? (
              <TextField
                value={inlineEditing.location_name}
                onChange={(e) => handleInlineInputChange('location_name', e.target.value)}
                size="small"
                fullWidth
              />
            ) : (
              location.locationName
            )}
          </TableCell>
        );
      },
    },
    {
      field: 'country',
      headerName: 'Country',
      flex: 1,
      headerClassName: 'custom-header-class',
      cellClassName: 'custom-cell-class',
      renderCell: (params: GridCellParams) => {
        const location = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === location.id ? (
              <TextField
                value={inlineEditing.country}
                onChange={(e) => handleInlineInputChange('country', e.target.value)}
                size="small"
                fullWidth
              />
            ) : (
              location.country || '-'
            )}
          </TableCell>
        );
      },
    },
    {
      field: 'controls',
      headerName: 'Controls',
      flex: 1,
      headerClassName: 'custom-header-class',
      cellClassName: 'custom-cell-class',
      renderCell: (params: GridCellParams) => {
        const location = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === location.id ? (
              <>
                <IconButton size="small" onClick={saveInlineEdit} color="primary">
                  <SaveIcon />
                </IconButton>
                <IconButton size="small" onClick={cancelInlineEdit} color="error">
                  <CancelIcon />
                </IconButton>
              </>
            ) : (
              <>
                <IconButton size="small" onClick={() => startInlineEdit(location)} color="primary">
                  <EditIcon />
                </IconButton>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (location.id) {
                      setDeletingLocationId(location.id);
                    }
                    setConfirmDialogOpen(true);
                  }}
                  color="error"
                >
                  <DeleteIcon />
                </IconButton>
              </>
            )}
          </TableCell>
        );
      },
    },
  ];

  return (
    <>
      <div className="gridstat">
        <div className="btnmainset">
          <div className="btncont">
            <div className="gridhedtxt">
              <span>Location</span>
            </div>

            <div className="btnrowset">
              <div className="inputBox_container">
                <svg className="search_icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">
                  <path d="M46.599 46.599a4.498 4.498 0 0 1-6.363 0l-7.941-7.941C29.028 40.749 25.167 42 21 42 9.402 42 0 32.598 0 21S9.402 0 21 0s21 9.402 21 21c0 4.167-1.251 8.028-3.342 11.295l7.941 7.941a4.498 4.498 0 0 1 0 6.363zM21 6C12.717 6 6 12.714 6 21s6.717 15 15 15c8.286 0 15-6.714 15-15S29.286 6 21 6z"></path>
                </svg>
                <input
                  className="inputBox"
                  id="inputBox"
                  type="text"
                  placeholder="Search by location"
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                onClick={() => {
                  setIsFormOpen(true);
                }}
                className="btnshow"
              >
                <span className=" tabcon">{<Plus size={20} strokeWidth={1.5} />}</span>Add locations
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[400px]">
            <div className="flex items-center space-x-2">
              <div className="clientmain  pb-1">
                <h2 className="scroll-m-20 mb-10 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                  Location information
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="clientName">Location name</Label>
                      <Input
                        id="location_name"
                        name="location_name"
                        type="text"
                        value={formData.location_name}
                        style={{ borderColor: errors.location_name ? 'red' : '' }}
                        onChange={(e) => {
                          handleChange(e);
                          validateField(e);
                        }}
                      />
                      <div className="error" style={{ color: 'red' }}>
                        {' '}
                        <span>{errors.location_name}</span>
                      </div>
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="country">Country</Label>
                      {/* <Input
                id="country"
                name="country"
                type="text"
                value={formData.country}
                style={{ borderColor: errors.country ? 'red' : '' }}
                onChange={(e)=>{
                  handleChange(e)
                  validateField(e)
                }}
              /> */}
                      {
                        <Select
                          options={options}
                          value={options.find((option) => option.value === value)}
                          onChange={changeHandler}
                        />
                      }
                      <div className="error" style={{ color: 'red' }}>
                        {' '}
                        <span>{errors.country}</span>
                      </div>
                    </div>
                  </div>
                  <div className="btnamain space-y-4">
                    <button className="buttonfill" type="submit">
                      <div className="wrap">
                        <p>Submit</p>
                      </div>
                    </button>
                    {/* <Button type="submit" className="w-full md:w-auto">
              Submit
            </Button> */}
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="clientmain1">
          <div className="">
            <ReusableDataGrid
              rows={filteredLocation}
              columns={columns}
              pageSize={10}
              className="maingridcss"
              // onRowClick={(params) => console.log('Row clicked:', params)}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete location"
        description="Are you sure you want to delete this location?"
        confirmText="Delete"
        cancelText="Cancel"
        variant="destructive"
      />

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
}
