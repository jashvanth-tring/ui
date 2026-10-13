import { LayoutContainer } from "../../styles/LayoutContainer";
'use client';

import { useEffect, useState } from 'react';
import { Input } from '../ui/input';
import { useAppSelector, useDispatch } from '../../store';
import { updateClients, FetchAllClients } from '../../store/action/client.action';
import { RootState } from '../../store/reducers';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { fetchPositionDetails } from '../../store/action/position-details.action';
import { Dialog, DialogContent } from '../ui/dialog.tsx';
import { ClipboardList, EditIcon, SearchIcon } from 'lucide-react';
import { fetchClientLocations } from '../../store/action/client-location.action.ts';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import { DataTable } from '../customized-table';
import EditClient from './edit-client';
import { Card, CardContent } from '../ui/card';
//import AddClientFormContainer from "./addClientFromContainer.tsx";
import AddClientWithRequirementStepper from './AddClientWithRequirementStepper.tsx';
import type { updateClientsPayload } from '../../store/model/client.types';
import { Tooltip, TooltipContent, TooltipTrigger, TooltipProvider } from '../ui/tooltip';
import { useNavigate } from 'react-router-dom';
import { TableContentLoader } from '../table-content-loader';

export default function Client() {
  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [searchQuery, setSearchQuery] = useState('');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [selectedClient, setSelectedClient] = useState<any>(null);

  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  const { clients, loading: clientsLoading } = useAppSelector(
    (state: RootState) => state.clientsSelector,
  );
  const { user } = useAppSelector((state: RootState) => state.authSelector) || {};

  const tablePrefState = useAppSelector((state: RootState) => state.tablePreference);

  const preferences = tablePrefState?.preferences || {};
  useEffect(() => {
    dispatch(FetchAllClients());
    dispatch(fetchPositionDetails());
    dispatch(fetchClientLocations());
    dispatch(fetchTablePreference('client'));
  }, [dispatch]);
  const safeClients = Array.isArray(clients) ? clients : [];

  const filteredClients = safeClients.filter(
    (c: any) =>
      c?.clientName?.toLowerCase()?.includes(searchQuery.toLowerCase()) ||
      c?.emailId?.toLowerCase()?.includes(searchQuery.toLowerCase())
  );
  const startEdit = (client: any) => {
    setSelectedClient(client);
    setIsEditFormOpen(true);
  };

  const handleEditSave = async (updatedClient: {
    id: number | null;
    clientName: string;
    emailId?: string;
    spocName?: string;
    spocContactNumber?: string;
    locations: string[];
  }) => {
    const profileId = updatedClient.id;
    const editorId = typeof user?.id === 'number' ? user.id : Number(user?.id);
    if (profileId == null || Number.isNaN(profileId)) {
      showErrorSnackbar('Invalid client');
      return;
    }
    if (!editorId || editorId < 1 || Number.isNaN(editorId)) {
      showErrorSnackbar('You must be signed in to update a client');
      return;
    }

    // Backend UpdateClientProfileDto only allows these fields; forbidNonWhitelisted rejects id, createdAt, etc.
    const payload: updateClientsPayload = {
      clientName: updatedClient.clientName ?? '',
      emailId: updatedClient.emailId,
      spocName: updatedClient.spocName,
      spocContactNumber: updatedClient.spocContactNumber,
      locations: Array.isArray(updatedClient.locations) ? updatedClient.locations : [],
      updatedBy: { id: editorId },
    };

    // Only call update API if something changed
    const base = selectedClient;
    const norm = (v: unknown) => String(v ?? '').trim();
    const normList = (xs: unknown) =>
      (Array.isArray(xs) ? xs : [])
        .map((x) => String(x ?? '').trim())
        .filter(Boolean)
        .sort()
        .join('|');
    const changed =
      norm(base?.clientName) !== norm(payload.clientName) ||
      norm(base?.emailId) !== norm(payload.emailId) ||
      norm(base?.spocName) !== norm(payload.spocName) ||
      norm(base?.spocContactNumber) !== norm(payload.spocContactNumber) ||
      normList(base?.locations) !== normList(payload.locations);
    if (!changed) {
      showSuccessSnackbar('No changes to update');
      setIsEditFormOpen(false);
      return;
    }

    try {
      const result = await dispatch(updateClients({ id: profileId, payload })).unwrap();

      if (result?.success) {
        setIsEditFormOpen(false);
        dispatch(FetchAllClients());
        showSuccessSnackbar('Client updated successfully');
      }
    } catch {
      showErrorSnackbar('Error updating client');
    }
  };
  const toPascalCase = (text: string) => {
    return text
      ?.toLowerCase()
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const columns = [
    {
      accessorKey: 'clientName',
      header: 'Client Name',
      enableHiding: false,
      cell: ({ row }: any) => toPascalCase(row.original?.clientName || ''),
    },
    {
      accessorKey: 'locations',
      header: 'Locations',
      enableHiding: false,
      cell: ({ row }: any) => row.original?.locations?.join(', ') || '-',
    },
    {
      accessorKey: 'emailId',
      header: 'Email',
      cell: ({ row }: any) => row.original?.emailId || '-',
    },
    {
      accessorKey: 'spocContactNumber',
      header: 'Phone Number',
      cell: ({ row }: any) => row.original?.spocContactNumber || '-',
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }: any) => {
        const client = row.original;

        return (
          <TooltipProvider delayDuration={200}>
            <div className="flex items-center gap-3">
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <EditIcon
                      className="w-4 h-4 cursor-pointer text-blue-500 hover:scale-110 transition-transform"
                      onClick={() => startEdit(client)}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Edit</p>
                </TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <span>
                    <ClipboardList
                      className="w-4 h-4 cursor-pointer text-violet-600 hover:scale-110 transition-transform"
                      role="button"
                      tabIndex={0}
                      onClick={() => {
                        const id = client?.id;
                        if (id == null || Number.isNaN(Number(id))) return;
                        navigate(`/requirements?clientId=${Number(id)}`);
                      }}
                      onKeyDown={(e) => {
                        if (e.key !== 'Enter' && e.key !== ' ') return;
                        e.preventDefault();
                        const id = client?.id;
                        if (id == null || Number.isNaN(Number(id))) return;
                        navigate(`/requirements?clientId=${Number(id)}`);
                      }}
                    />
                  </span>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Go to requirements (this client)</p>
                </TooltipContent>
              </Tooltip>
            </div>
          </TooltipProvider>
        );
      },
    },
  ];
  return (
    <LayoutContainer>
    <main>
      {/* HEADER */}
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--brand)]">Client Management</h1>

        <div className="flex  items-center gap-3">
          <div className="relative w-64">
            <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search..."
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>
        </div>
      </div>

      {/* TABLE */}
      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <TableContentLoader loading={clientsLoading} label="Loading clients…">
            <DataTable
              columns={columns}
              data={filteredClients}
              tableName="client"
              preferences={preferences}
            />
          </TableContentLoader>
        </CardContent>
      </Card>

      {/* ADD */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="max-w-7xl p-0">
          <AddClientWithRequirementStepper
            isOpen={isFormOpen}
            onClose={() => setIsFormOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* EDIT */}
      {selectedClient && (
        <Dialog open={isEditFormOpen} onOpenChange={setIsEditFormOpen}>
          <DialogContent className="max-w-2xl p-0">
            <EditClient
              client={selectedClient}
              onSave={handleEditSave}
              onCancel={() => setIsEditFormOpen(false)}
            />
          </DialogContent>
        </Dialog>
      )}
      {/* SNACKBAR */}
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </main>
    </LayoutContainer>
  );
}
