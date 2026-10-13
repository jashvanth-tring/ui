import React, { useEffect, useState } from 'react';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { useSnackbar } from '../../utils/snackbar-function';
import { fetchAllRounds, deleteRounds } from '../../store/action/round.action';
import { RoundDetailsLocal } from '../../store/model/round.types';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';
import {
  PencilIcon,
  TrashIcon,
  PlusIcon,
  DownloadIcon,
  SearchIcon,
  CheckCircle,
  XCircle,
  Calendar,
} from 'lucide-react';
import CustomizedSnackbars from '../customized-snackbar';
import ConfirmationDialog from '../confirmation-dialog';
import AddRoundForm from './add-round';
import EditRoundForm from './edit-round';

interface RoundDetails {
  id: number;
  roundName: string;
  feedBack: string;
  candidate: {
    id: number;
    candidateName: string;
  };
  interviewDate: string;
  position: {
    id: number;
    positionName: string;
  };
  complete: boolean;
}

export default function Rounds() {
  // Global states
  // const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { rounds } = useAppSelector((state: RootState) => state?.roundsSelector) || {};

  // Local states
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  const [deletingRoundId, setDeletingRoundId] = useState<number>(0);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedRound, setSelectedRound] = useState<RoundDetailsLocal | null>(null);

  const dispatch = useDispatch();

  // Handlers
  const handleDelete = async () => {
    if (deletingRoundId) {
      try {
        const result = await dispatch(deleteRounds(deletingRoundId)).unwrap();
        if (result?.success) {
          dispatch(fetchAllRounds());
          showSuccessSnackbar('Round deleted successfully');
          setConfirmDialogOpen(false);
          setDeletingRoundId(0);
        } else {
          showErrorSnackbar('An error occurred while deleting the Round');
        }
      } catch (error) {
        console.error('Error deleting Round:', error);
        showErrorSnackbar('An error occurred while deleting the Round');
      }
    }
  };

  // Fetch data on component mount
  useEffect(() => {
    async function fetchRound() {
      try {
        await dispatch(fetchAllRounds()).unwrap();
      } catch (error) {
        console.log(error);
      }
    }
    fetchRound();
  }, [dispatch]);

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredRounds = rounds?.filter((round: RoundDetailsLocal) => {
    if (round && round?.roundName) {
      const query = searchQuery.toLowerCase();
      const mainRound = round.roundName?.toLowerCase() || '';
      return mainRound.includes(query);
    }
    return false;
  });

  const startEdit = (round: RoundDetailsLocal) => {
    setSelectedRound(round);
    setIsEditDialogOpen(true);
  };

  return (
    <main>
      <div className=" ">
        <div className="py-3  border-slate-300 flex justify-between items-center p-3">
          <h1 className="text-xl pt-2 font-semibold flex  items-center px-7">Interview Rounds</h1>

          <div className="flex space-x-3 px-3">
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by round name..."
                onChange={handleSearchChange}
                className="pl-9 w-full bg-white/90 border-0 text-black focus:ring-2 focus:ring-indigo-400"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2  text-[var(--brand)] hover:bg-[var(--brand)] hover:text-white transition-colors"
            >
              <DownloadIcon className="h-3 w-4" />
              <span>Export</span>
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-[var(--brand)] text-white hover:bg-primary-800"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Round
            </Button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-grow p-3 overflow-hidden flex flex-col h-screen">
        <Card className="flex-grow flex rounded-sm flex-col overflow-hidden shadow-md border-0">
          <CardContent className="p-0 flex-grow overflow-auto">
            {filteredRounds && filteredRounds.length > 0 ? (
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-auto px-6 py-1">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-0">
                      <TableRow className="border-b-2 border-indigo-600/20">
                        <TableHead className="font-semibold text-indigo-900 py-4">
                          Round Name
                        </TableHead>
                        <TableHead className="font-semibold text-indigo-900 py-4">
                          Feedback
                        </TableHead>
                        <TableHead className="font-semibold text-indigo-900 py-4">
                          Candidate
                        </TableHead>
                        <TableHead className="font-semibold text-indigo-900 py-4">
                          Interview Date
                        </TableHead>
                        <TableHead className="font-semibold text-indigo-900 py-4">
                          Position
                        </TableHead>
                        <TableHead className="font-semibold text-indigo-900 py-4">Status</TableHead>
                        <TableHead className="text-right font-semibold text-indigo-900 py-4">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredRounds.map((round: RoundDetails) => (
                        <TableRow
                          key={round.id}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <TableCell className="font-medium py-1">{round.roundName}</TableCell>
                          <TableCell className="py-1 max-w-xs truncate">
                            {round.feedBack || '-'}
                          </TableCell>
                          <TableCell className="py-1">{round.candidate.candidateName}</TableCell>
                          <TableCell className="py-1">
                            {new Date(round.interviewDate).toLocaleDateString()}
                          </TableCell>
                          <TableCell className="py-1">{round.position.positionName}</TableCell>
                          <TableCell className="py-1">
                            <div className="flex items-center">
                              {round.complete ? (
                                <span className="flex items-center text-green-600">
                                  <CheckCircle className="h-4 w-4 mr-1" /> Complete
                                </span>
                              ) : (
                                <span className="flex items-center text-amber-600">
                                  <XCircle className="h-4 w-4 mr-1" /> Incomplete
                                </span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell className="text-right py-1">
                            <div className="flex justify-end space-x-1">
                              <Button
                                onClick={() => startEdit(round)}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                              >
                                <PencilIcon className="h-4 w-4" />
                              </Button>
                              <Button
                                onClick={() => {
                                  if (round.id) {
                                    setDeletingRoundId(round.id);
                                  }
                                  setConfirmDialogOpen(true);
                                }}
                                size="sm"
                                variant="ghost"
                                className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                              >
                                <TrashIcon className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                <Calendar className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No rounds found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Add a new interview round to get started
                </p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-[var(--brand)] text-white hover:bg-[#1e3a6d]"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Round
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Add Round Dialog */}
      <AddRoundForm
        isOpen={isFormOpen}
        setIsOpen={setIsFormOpen}
        onSuccess={() => {
          dispatch(fetchAllRounds());
          showSuccessSnackbar('Round created successfully');
        }}
        onError={(message) => showErrorSnackbar(message)}
      />

      {/* Edit Round Dialog */}
      {selectedRound && (
        <EditRoundForm
          isOpen={isEditDialogOpen}
          setIsOpen={setIsEditDialogOpen}
          round={selectedRound}
          onSuccess={() => {
            dispatch(fetchAllRounds());
            showSuccessSnackbar('Round updated successfully');
          }}
          onError={(message) => showErrorSnackbar(message)}
        />
      )}

      {/* Confirmation Dialog for Delete */}
      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Round"
        description="Are you sure you want to delete this round? This action cannot be undone."
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
    </main>
  );
}
