import { useState, useEffect } from 'react';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { updateRounds } from '../../store/action/round.action';
import { RoundDetailsLocal } from '../../store/model/round.types';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Textarea } from '../ui/textarea';
import { Label } from '../ui/label';
import { Checkbox } from '@mui/material';

interface EditRoundFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  round: RoundDetailsLocal;
  onSuccess: () => void;
  onError: (message: string) => void;
}

interface InlineEditingState {
  id: number | null;
  roundName: string;
  feedBack: string;
  candidate: string;
  interviewDate: string;
  position: string;
  complete: boolean;
}

export default function EditRoundForm({
  isOpen,
  setIsOpen,
  round,
  onSuccess,
  onError,
}: EditRoundFormProps) {
  const dispatch = useDispatch();
  const { user } = useAppSelector((state: RootState) => state?.authSelector);

  const [inlineEditing, setInlineEditing] = useState<InlineEditingState>({
    id: null,
    roundName: '',
    feedBack: '',
    candidate: '',
    interviewDate: '',
    position: '',
    complete: false,
  });

  // Initialize the form with the round data
  useEffect(() => {
    if (round) {
      setInlineEditing({
        id: round.id,
        roundName: round.roundName,
        feedBack: round.feedBack,
        candidate: round.candidate.id + '',
        interviewDate: round.interviewDate,
        position: round.position.id + '',
        complete: round.complete,
      });
    }
  }, [round]);

  const handleInlineInputChange = (field: keyof InlineEditingState, value: string | boolean) => {
    setInlineEditing((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleSave = async () => {
    if (inlineEditing.id) {
      try {
        const result = await dispatch(
          updateRounds({
            id: inlineEditing.id,
            payload: {
              feedBack: inlineEditing.feedBack,
              roundName: inlineEditing.roundName,
              candidate: { id: parseInt(inlineEditing.candidate) },
              interviewDate: inlineEditing.interviewDate,
              position: { id: parseInt(inlineEditing.position) },
              complete: inlineEditing.complete,
              updatedBy: { id: user?.id },
            },
          })
        ).unwrap();

        if (result.success) {
          onSuccess();
          setIsOpen(false);
        } else {
          onError('Failed to update round');
        }
      } catch (error) {
        console.error('Error updating round:', error);
        onError('An error occurred while updating the round');
      }
    }
  };

  const handleCancel = () => {
    setIsOpen(false);
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--brand)rand)] flex items-center">
            Update Round
          </DialogTitle>
        </DialogHeader>
        <div className="space-y-4 py-4">
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-feedback" className="text-[var(--brand)]">
                Feedback
              </Label>
              <Textarea
                id="edit-feedback"
                placeholder="Enter feedback"
                value={inlineEditing.feedBack}
                onChange={(e) => handleInlineInputChange('feedBack', e.target.value)}
                className="border-gray-300 focus:border-[var(--brand)] focus:ring-[var(--brand)]/20"
                rows={4}
              />
            </div>

            <div className="flex items-center space-x-2">
              <Checkbox
                id="edit-complete"
                checked={inlineEditing.complete}
                onChange={(e) => handleInlineInputChange('complete', e.target.checked)}
              />
              <Label htmlFor="edit-complete" className="text-[var(--brand)]">
                Mark as Complete
              </Label>
            </div>
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCancel}
              className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              className="bg-gradient-to-r from-[var(--brand)] to-[#1e3a6d] hover:from-[var(--brand)] hover:to-[var(--brand)] text-white"
            >
              Save Changes
            </Button>
          </DialogFooter>
        </div>
      </DialogContent>
    </Dialog>
  );
}
