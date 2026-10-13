import { useEffect, useState } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import {
  fetchPositionDetails,
  updatePositionDetail,
  deletePositionDetail,
} from '../../store/action/position-details.action';
import { Position } from '../../store/model';
import { AppDispatch } from '../../store';
import { HttpStatusCode } from '../../constants';
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
  SaveIcon,
  XIcon,
  FileTextIcon,
} from 'lucide-react';
import CustomizedSnackbars from '../customized-snackbar';
import ConfirmationDialog from '../confirmation-dialog';
import { useSnackbar } from '../../utils/snackbar-function';
import AddDesignationForm from './add-designation';
import * as XLSX from 'xlsx';

interface InlineEditingState {
  id: number | null;
  positionName: string;
  description: string;
}

const PositionFormData = () => {
  const dispatch = useDispatch<AppDispatch>();

  const [editingId, setEditingId] = useState<number | null>(null);
  const [inlineEditing, setInlineEditing] = useState<InlineEditingState>({
    id: null,
    positionName: '',
    description: '',
  });
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [deletingPositionId, setDeletingPositionId] = useState<number>(0);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  useEffect(() => {
    dispatch(fetchPositionDetails());
  }, [dispatch]);

  const { positions } = useSelector((state: RootState) => state?.positionDetailsSelector);

  const handleDelete = async () => {
    if (deletingPositionId) {
      try {
        const response = await dispatch(deletePositionDetail(deletingPositionId));
        if (
          typeof response?.payload !== 'string' &&
          response?.payload?.statusCode !== HttpStatusCode.OK
        ) {
          showErrorSnackbar('Failed to delete position');
        } else {
          showSuccessSnackbar('Position deleted successfully');
          setConfirmDialogOpen(false);
          setDeletingPositionId(0);
        }
      } catch (error) {
        console.error('Error deleting position:', error);
        showErrorSnackbar('An error occurred while deleting the position');
      }
    }
  };

  const startInlineEdit = (position: Position) => {
    setInlineEditing({
      id: position.id,
      positionName: position.positionName,
      description: position.description || '',
    });
  };

  const cancelInlineEdit = () => {
    setInlineEditing({
      id: null,
      positionName: '',
      description: '',
    });
  };

  const handleInlineInputChange = (field: keyof InlineEditingState, value: string) => {
    setInlineEditing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const saveInlineEdit = async () => {
    if (inlineEditing.id) {
      try {
        const result = await dispatch(
          updatePositionDetail({
            id: inlineEditing.id,
            payload: {
              positionName: inlineEditing.positionName,
              description: inlineEditing.description,
              updatedBy: { id: 1 },
            },
          })
        ).unwrap();

        if (result?.statusCode === 200) {
          dispatch(fetchPositionDetails());
          showSuccessSnackbar('Position updated successfully');
        } else {
          showErrorSnackbar(result?.message ?? 'Position has not created');
        }
        cancelInlineEdit();
      } catch (error) {
        console.error('Error updating position:', error);
        showErrorSnackbar('An error occurred while updating the position');
      }
    }
  };

  //search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredPositions = positions.filter((positionz: Position) => {
    if (positionz) {
      const query = searchQuery.toLowerCase();
      const position = positionz.positionName?.toLowerCase() || '';
      return position.includes(query);
    }
    return false;
  });

  const handleExport = () => {
    // Prepare data for export
    const data = filteredPositions.map((position: Position) => ({
      'Role Name': position.positionName,
      Description: position.description || '-',
    }));

    // Create a worksheet
    const ws = XLSX.utils.json_to_sheet(data);

    // Create a workbook
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Designations');

    // Export the file
    XLSX.writeFile(wb, 'designations.xlsx');
  };

  return (
    <main>
      <div className=" ">
        <div className="py-3  border-slate-300 flex justify-between items-center p-3">
          <h1 className="text-xl pt-2 font-semibold flex  items-center px-7">
            Designation Management
          </h1>

          <div className="flex space-x-3 px-3">
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search by designation..."
                onChange={handleSearchChange}
                className="pl-9 w-full bg-white/90 border-0 focus:ring-2 focus:ring-blue-400 text-black"
              />
            </div>
            <Button
              variant="outline"
              className="flex items-center space-x-2  text-[var(--brand)rand)] hover:bg-[var(--brand)] hover:text-white transition-colors"
              onClick={handleExport}
            >
              <DownloadIcon className="h-3 w-4" />
              <span>Export</span>
            </Button>
            <Button
              onClick={() => setIsFormOpen(true)}
              className="bg-[var(--brand)] text-white hover:bg-primary-800"
            >
              <PlusIcon className="mr-2 h-4 w-4" />
              Add Designation
            </Button>
          </div>
        </div>
      </div>

      <div className=" flex-grow p-3  overflow-hidden flex flex-col h-screen">
        <Card className="flex-grow rounded-sm  flex flex-col overflow-hidden shadow-md border-0">
          <CardContent className="p-0 flex-grow overflow-auto">
            {positions.length > 0 ? (
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-auto px-0 py-1">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-0">
                      <TableRow className="border-b-2 border-[var(--brand)]/20">
                        <TableHead className="font-semibold text-[var(--brand)] py-1">
                          Role Name
                        </TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">
                          Description
                        </TableHead>
                        <TableHead className="text-right font-semibold text-[var(--brand)] py-1">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions.map((position: Position) => (
                        <TableRow
                          key={position.id}
                          className="hover:bg-gray-50 border-b border-gray-100"
                        >
                          <TableCell className="font-medium py-1">
                            {inlineEditing.id === position.id ? (
                              <Input
                                value={inlineEditing.positionName}
                                onChange={(e) =>
                                  handleInlineInputChange('positionName', e.target.value)
                                }
                                className="w-full border-[var(--brand)]/30 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                              />
                            ) : (
                              position.positionName
                            )}
                          </TableCell>
                          <TableCell className="py-1">
                            {inlineEditing.id === position.id ? (
                              <Input
                                value={inlineEditing.description}
                                onChange={(e) =>
                                  handleInlineInputChange('description', e.target.value)
                                }
                                className="w-full border-[var(--brand)]/30 focus:border-[var(--brand)] focus:ring-1 focus:ring-[var(--brand)]"
                              />
                            ) : (
                              position.description || '-'
                            )}
                          </TableCell>
                          <TableCell className="text-right py-1">
                            {inlineEditing.id === position.id ? (
                              <div className="flex justify-end space-x-2">
                                <Button
                                  onClick={saveInlineEdit}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-green-500 hover:text-green-600 hover:bg-green-50"
                                >
                                  <SaveIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={cancelInlineEdit}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50"
                                >
                                  <XIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            ) : (
                              <div className="flex justify-end space-x-1">
                                <Button
                                  onClick={() => startInlineEdit(position)}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-blue-500 hover:text-blue-600 hover:bg-blue-50 rounded-full"
                                >
                                  <PencilIcon className="h-4 w-4" />
                                </Button>
                                <Button
                                  onClick={() => {
                                    setDeletingPositionId(position.id);
                                    setConfirmDialogOpen(true);
                                  }}
                                  size="sm"
                                  variant="ghost"
                                  className="h-8 w-8 p-0 text-red-500 hover:text-red-600 hover:bg-red-50 rounded-full"
                                >
                                  <TrashIcon className="h-4 w-4" />
                                </Button>
                              </div>
                            )}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                <FileTextIcon className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No designations found</p>
                <p className="text-sm text-gray-400 mt-2">Add a new designation to get started</p>
                <Button
                  onClick={() => setIsFormOpen(true)}
                  className="mt-4 bg-[var(--brand)] text-white hover:bg-[#1e3a6d]"
                >
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Designation
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
      <AddDesignationForm
        isFormOpen={isFormOpen}
        setIsFormOpen={setIsFormOpen}
        editingId={editingId}
        setEditingId={setEditingId}
        showSuccessSnackbar={showSuccessSnackbar}
        showErrorSnackbar={showErrorSnackbar}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => setConfirmDialogOpen(false)}
        onConfirm={handleDelete}
        title="Delete Designation"
        description="Are you sure you want to delete this designation!"
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
};

export default PositionFormData;
