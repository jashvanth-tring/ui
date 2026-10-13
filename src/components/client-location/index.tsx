import { useEffect, useState } from 'react';
import { useAppSelector, useDispatch } from '../../store';
import { Label } from '../ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { RootState } from '../../store/reducers';
import {
  createClientLocations,
  deleteClientLocations,
  fetchClientLocations,
} from '../../store/action/client-location.action';
import ConfirmationDialog from '../confirmation-dialog';
import { HttpStatusCode } from '../../constants';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { client } from '../../store/model/client.types';
import type { location } from '../../store/model/location.types';
import { IconButton, TableCell, TextField } from '@mui/material';
import { Delete as DeleteIcon } from '@mui/icons-material';
import { fetchLocation } from '../../store/model/client-location.types';
import { Button } from '../ui/button';
import { Dialog, DialogContent } from '../ui/dialog';
import ReusableDataGrid from '../data-grid';
import { GridCellParams } from '@mui/x-data-grid';
import { Plus } from 'lucide-react';

interface ClientLocationFormData {
  location_id: string;
  client_id: string;
}

const ClientLocationFormData = () => {
  //global state
  const { clients } = useAppSelector((state: RootState) => state?.clientsSelector);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { locations } = useAppSelector((state: RootState) => state?.locationsSelector);
  const { clientLocations } = useAppSelector((state: RootState) => state?.clientLocationSelector);

  //global state
  const dispatch = useDispatch();
  //local state
  const [errorss, setError] = useState({
    location_id: '',
    client_id: '',
  });
  const [formData, setFormData] = useState<ClientLocationFormData>({
    location_id: '',
    client_id: '',
  });

  const [inlineEditing] = useState({
    id: null,
    location_name: '',
    country: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deletingClientLocationId, setDeletingClientLocationId] = useState<number>(0);

  // functions
  const validateForm = () => {
    const errors: {
      location_id: string;
      client_id: string;
    } = {
      location_id: '',
      client_id: '',
    };
    if (!formData.location_id) {
      errors.location_id = 'Please enter the location details';
    }

    if (!formData.client_id) {
      errors.client_id = 'Please enter the client details';
    }

    setError(errors);
    return errors;
  };
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm();
    if (Object.values(error).some((value) => value !== '')) {
      setError(error);
      return;
    }
    const form_data = {
      clientProfile: {
        id: parseInt(formData.client_id),
      },
      location: {
        id: parseInt(formData.location_id),
      },
      createdBy: {
        id: user?.id,
      },
    };
    setIsFormOpen(false);

    try {
      const response = await dispatch(createClientLocations(form_data)).unwrap();
      if (response?.statusCode === HttpStatusCode.CREATED) {
        await showSuccessSnackbar(response?.message || 'Client Location Added sucessfully!');
        await dispatch(fetchClientLocations());
      } else {
        showErrorSnackbar(response?.message || 'Failed to create client Location ');
      }
    } catch (error) {
      console.log(error);
    }
  };

  const handleDelete = async () => {
    if (deletingClientLocationId) {
      try {
        const result = await dispatch(deleteClientLocations(deletingClientLocationId)).unwrap();
        if (result?.success) {
          dispatch(fetchClientLocations());
          showSuccessSnackbar('Clients Location deleted successfully');
          setConfirmDialogOpen(false);
          setDeletingClientLocationId(0);
        } else {
          showErrorSnackbar('An error occurred while deleting the clients locations');
        }
      } catch (error) {
        console.error('Error deleting Client location :', error);
        showErrorSnackbar('An error occurred while deleting the client locations');
      }
    }
  };

  useEffect(() => {
    async function fetchClientsLocations() {
      try {
        await dispatch(fetchClientLocations()).unwrap();
      } catch (error) {
        console.log(error);
      }
    }
    fetchClientsLocations();
  }, [dispatch]);

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      client_id: value,
    });
  };

  const handleSelectPosition = (value: string) => {
    setFormData({
      ...formData,
      location_id: value,
    });
  };
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  //search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };
  const filteredclientLocations = clientLocations.filter((clientloc: fetchLocation) => {
    if (clientloc.clientProfile?.clientName && clientloc.location.locationName) {
      const query = searchQuery.toLowerCase();
      const profile = clientloc.clientProfile?.clientName;
      const location = clientloc.location.locationName;

      if (profile && location) {
        return profile.includes(query) || location.includes(query);
      }
    } else {
      return clientLocations;
    }
    return clientLocations;
  });

  const columns = [
    {
      field: 'clientName',
      headerName: 'Client Name',
      flex: 1,
      headerClassName: 'custom-header-class',
      cellClassName: 'custom-cell-class',
      renderCell: (params: GridCellParams) => {
        const clientLocation = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === clientLocation.id ? (
              <TextField fullWidth value={inlineEditing.location_name} size="small" />
            ) : (
              clientLocation.clientProfile?.clientName
            )}
          </TableCell>
        );
      },
    },
    {
      field: 'location',
      headerName: 'Location',
      flex: 1,
      headerClassName: 'custom-header-class',
      cellClassName: 'custom-cell-class',
      renderCell: (params: GridCellParams) => {
        const clientLocation = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === clientLocation.id ? (
              <TextField fullWidth value={inlineEditing.country} size="small" />
            ) : (
              clientLocation.location.locationName
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
        const clientLocation = params.row;
        return (
          <TableCell sx={{ padding: '3px', textAlign: 'center' }}>
            {inlineEditing.id === clientLocation.id ? (
              <></>
            ) : (
              <>
                <IconButton
                  size="small"
                  onClick={() => {
                    if (clientLocation.id) {
                      setDeletingClientLocationId(clientLocation.id);
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
              <span>Client Location</span>
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
                  placeholder="Search by name"
                  onChange={handleSearchChange}
                />
              </div>
              <Button
                onClick={() => {
                  setIsFormOpen(true);
                }}
                className="btnshow"
              >
                <span className="mr-1 tabcon">{<Plus size={20} strokeWidth={1.5} />}</span>
                Add client location
              </Button>
            </div>
          </div>
        </div>

        <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
          <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[500px]">
            <div className="flex items-center space-x-2">
              <div className="clientmain  pb-1">
                <h2 className="scroll-m-20 mb-10 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
                  Client Location Information
                </h2>
                <form onSubmit={handleSubmit} className="space-y-6">
                  <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-6">
                    <div className="space-y-2">
                      <Label htmlFor="client_id">Client Name</Label>
                      <div id="client_id" className={errorss?.client_id ? 'select-error' : ''}>
                        <Select name="client_id" onValueChange={handleSelectChange}>
                          <SelectTrigger className="fullwid">
                            <SelectValue placeholder="Select client details" />
                          </SelectTrigger>
                          <SelectContent>
                            {clients.map((client: client) => {
                              return (
                                <SelectItem key={client.id} value={String(client.id)}>
                                  {client.clientName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="error" style={{ color: 'red' }}>
                        {' '}
                        <span>{errorss?.client_id}</span>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="location_id">Location</Label>
                      <div id="location_id" className={errorss?.location_id ? 'select-error' : ''}>
                        <Select name="location_id" onValueChange={handleSelectPosition}>
                          <SelectTrigger className="fullwid">
                            <SelectValue placeholder="Please select the location" />
                          </SelectTrigger>
                          <SelectContent>
                            {locations.map((locations: location) => {
                              return (
                                <SelectItem key={locations.id} value={String(locations.id)}>
                                  {locations.locationName}
                                </SelectItem>
                              );
                            })}
                          </SelectContent>
                        </Select>
                      </div>
                      <div className="error" style={{ color: 'red' }}>
                        {' '}
                        <span>{errorss?.location_id}</span>
                      </div>
                    </div>
                  </div>
                  <div className="btnamain space-y-4">
                    <button className="buttonfill" type="submit">
                      Submit
                    </button>
                  </div>
                </form>
              </div>
            </div>
          </DialogContent>
        </Dialog>

        <div className="clientmain1">
          <div className="">
            <ReusableDataGrid
              rows={filteredclientLocations}
              columns={columns}
              pageSize={10}
              className="maingridcss"
              onRowClick={(params) => console.log('Row clicked:', params)}
            />
          </div>
        </div>
      </div>

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Client"
        description="Are you sure you want to delete this Client?"
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
};

export default ClientLocationFormData;
