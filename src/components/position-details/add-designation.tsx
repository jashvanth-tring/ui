import { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import {
  addPositionDetail,
  updatePositionDetail,
} from '../../store/action/position-details.action';
import { Position } from '../../store/model';
import { AppDispatch } from '../../store';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';

interface PositionFormData {
  positionName: string;
  description?: string;
}

interface AddDesignationFormProps {
  isFormOpen: boolean;
  setIsFormOpen: (open: boolean) => void;
  editingId: number | null;
  setEditingId: (id: number | null) => void;
  showSuccessSnackbar: (message: string) => void;
  showErrorSnackbar: (message: string) => void;
}

const AddDesignationForm = ({
  isFormOpen,
  setIsFormOpen,
  editingId,
  setEditingId,
  showSuccessSnackbar,
  showErrorSnackbar,
}: AddDesignationFormProps) => {
  const dispatch = useDispatch<AppDispatch>();

  const {
    register,
    handleSubmit,
    reset,
    setValue,
    formState: { errors },
  } = useForm<PositionFormData>();

  const { positions, loading } = useSelector((state: RootState) => state?.positionDetailsSelector);

  // Set form values when editing
  useEffect(() => {
    if (editingId) {
      const position = positions.find((pos: Position) => pos.id === editingId);
      if (position) {
        setValue('positionName', position.positionName);
        setValue('description', position.description || '');
      }
    }
  }, [editingId, positions, setValue]);

  const onSubmit = async (data: PositionFormData) => {
    try {
      setIsFormOpen(false);
      if (editingId) {
        await dispatch(
          updatePositionDetail({
            id: editingId,
            payload: {
              positionName: data.positionName,
              description: data.description || '',
              updatedBy: { id: 1 },
            },
          })
        );
        showSuccessSnackbar('Position updated successfully');
      } else {
        await dispatch(
          addPositionDetail({
            positionName: data.positionName,
            description: data.description || '',
            createdBy: { id: 1 },
          })
        );
        showSuccessSnackbar('Position added successfully');
      }
      reset();
      setEditingId(null);
    } catch (error) {
      console.error('Error submitting form:', error);
      showErrorSnackbar('An error occurred while processing your request');
    }
  };

  return (
    <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--brand)] flex items-center">
            {editingId ? 'Edit Designation' : 'Add New Designation'}
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 py-4">
          <div className="space-y-2">
            <Label htmlFor="positionName" className="text-[var(--brand)]">
              Role Name
            </Label>
            <Input
              id="positionName"
              placeholder="Enter role name"
              {...register('positionName', { required: 'Role name is required' })}
              className={
                errors.positionName
                  ? 'border-red-500 focus:ring-red-300'
                  : 'border-gray-300 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20'
              }
            />
            {errors.positionName && (
              <p className="text-red-500 text-sm">{errors.positionName.message}</p>
            )}
          </div>
          <div className="space-y-2">
            <Label htmlFor="description" className="text-[var(--brand)]">
              Description
            </Label>
            <Textarea
              id="description"
              placeholder="Enter description"
              rows={3}
              {...register('description')}
              className="border-gray-300 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20 resize-none"
            />
          </div>
          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setEditingId(null);
                reset();
                setIsFormOpen(false);
              }}
              className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={loading}
              className="bg-gradient-to-r from-[var(--brand)] to-[#1e3a6d] hover:from-[var(--brand)] hover:to-[var(--brand)] text-white"
            >
              {loading ? 'Processing...' : editingId ? 'Update' : 'Add'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default AddDesignationForm;
