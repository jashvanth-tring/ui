import React, { useState, useEffect } from 'react';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { candidateProfile } from '../../store/model/candidate.types';
import { createRounds } from '../../store/action/round.action';
import { fetchPositionDetails } from '../../store/action/position-details.action';
import { FetchAllCandidate } from '../../store/action/candidate.action';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from '../ui/select';
import { Position } from '../../store/model/position-details.types';

interface FormData {
  roundName: string;
  feedBack: string;
  candidateId: string;
  interview_date: string;
  positionId: string;
  isComplete: boolean;
}

interface AddRoundFormProps {
  isOpen: boolean;
  setIsOpen: (isOpen: boolean) => void;
  onSuccess: () => void;
  onError: (message: string) => void;
}

export default function AddRoundForm({ isOpen, setIsOpen, onSuccess, onError }: AddRoundFormProps) {
  const dispatch = useDispatch();
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { candidates, loading: candidatesLoading } =
    useAppSelector((state: RootState) => state?.candidatesSelector) || {};
  const { positions, loading: positionsLoading } =
    useAppSelector((state: RootState) => state?.positionDetailsSelector) || {};

  // Fetch positions when dialog opens
  useEffect(() => {
    if (isOpen) {
      dispatch(fetchPositionDetails());
      dispatch(FetchAllCandidate());
    }
  }, [dispatch, isOpen]);

  const [formData, setFormData] = useState<FormData>({
    roundName: '',
    feedBack: ' ',
    candidateId: '',
    interview_date: '',
    positionId: '',
    isComplete: false,
  });

  const [errors, setErrors] = useState({
    roundName: '',
    feedBack: '',
    candidateId: '',
    interview_date: '',
    positionId: '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
    validateField(e);
  };

  const validateField = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (value !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {
      roundName: '',
      feedBack: '',
      candidateId: '',
      interview_date: '',
      positionId: '',
    };

    if (!formData.roundName) {
      newErrors.roundName = 'Please fill in the Round name';
    }
    if (!formData.feedBack) {
      newErrors.feedBack = 'Please fill in the Feedback';
    }
    if (!formData.candidateId) {
      newErrors.candidateId = 'Please select a Candidate';
    }
    if (!formData.interview_date) {
      newErrors.interview_date = 'Please fill in the interview date';
    }
    if (!formData.positionId) {
      newErrors.positionId = 'Please select a position';
    }

    setErrors(newErrors);
    return newErrors;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const validationErrors = validateForm();

    if (Object.values(validationErrors).some((value) => value !== '')) {
      return;
    }

    const form_data = {
      candidate: {
        id: parseInt(formData.candidateId),
      },
      position: {
        id: parseInt(formData.positionId),
      },
      feedBack: formData.feedBack,
      roundName: formData.roundName,
      interviewDate: String(formData.interview_date),
      complete: formData.isComplete,
      createdBy: {
        id: user?.id,
      },
    };

    setIsOpen(false);

    try {
      const response = await dispatch(createRounds(form_data)).unwrap();
      if (response?.success) {
        resetForm();
        onSuccess();
      } else {
        onError('Round is already present');
      }
    } catch (error) {
      console.error('Error creating round:', error);
      onError('An error occurred while creating the round');
    }
  };

  const resetForm = () => {
    setFormData({
      roundName: '',
      feedBack: '',
      candidateId: '',
      interview_date: '',
      positionId: '',
      isComplete: false,
    });
  };

  const handleSelectPosition = (value: string) => {
    setFormData({
      ...formData,
      positionId: value,
    });
    setErrors((prev) => ({ ...prev, positionId: '' }));
  };

  const handleCandidateChange = (value: string) => {
    setFormData({
      ...formData,
      candidateId: value,
    });
    setErrors((prev) => ({ ...prev, candidateId: '' }));
  };

  // const handleCompleteChange = (e: React.ChangeEvent<HTMLInputElement>) => {
  //   setFormData({
  //     ...formData,
  //     isComplete: e.target.checked,
  //   });
  // };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-xl font-semibold text-[var(--brand)rand)] flex items-center">
            Add New Round
          </DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="positionId" className="text-[var(--brand)]">
                Position Name
              </Label>
              <Select value={formData.positionId} onValueChange={handleSelectPosition}>
                <SelectTrigger className={`w-full ${errors.positionId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select position" />
                </SelectTrigger>
                <SelectContent>
                  {positions && positions.length > 0 ? (
                    positions.map((position: Position) => (
                      <SelectItem key={position.id} value={String(position.id)}>
                        {position.positionName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-positions" disabled>
                      {positionsLoading ? 'Loading positions...' : 'No positions available'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.positionId && <p className="text-red-500 text-sm">{errors.positionId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="candidateId" className="text-[var(--brand)]">
                Candidate Name
              </Label>
              <Select value={formData.candidateId} onValueChange={handleCandidateChange}>
                <SelectTrigger className={`w-full ${errors.candidateId ? 'border-red-500' : ''}`}>
                  <SelectValue placeholder="Select candidate" />
                </SelectTrigger>
                <SelectContent>
                  {candidates && candidates.length > 0 ? (
                    candidates.map((candidate: candidateProfile) => (
                      <SelectItem key={candidate.id} value={String(candidate.id)}>
                        {candidate.candidateName}
                      </SelectItem>
                    ))
                  ) : (
                    <SelectItem value="no-candidates" disabled>
                      {candidatesLoading ? 'Loading candidates...' : 'No candidates available'}
                    </SelectItem>
                  )}
                </SelectContent>
              </Select>
              {errors.candidateId && <p className="text-red-500 text-sm">{errors.candidateId}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="roundName" className="text-[var(--brand)]">
                Round Name
              </Label>
              <Input
                id="roundName"
                name="roundName"
                placeholder="Enter round name"
                value={formData.roundName}
                onChange={handleChange}
                className={errors.roundName ? 'border-red-500 focus:ring-red-300' : ''}
              />
              {errors.roundName && <p className="text-red-500 text-sm">{errors.roundName}</p>}
            </div>

            <div className="space-y-2">
              <Label htmlFor="interview_date" className="text-[var(--brand)]">
                Interview Date
              </Label>
              <Input
                id="interview_date"
                name="interview_date"
                type="date"
                value={formData.interview_date}
                onChange={handleChange}
                className={errors.interview_date ? 'border-red-500 focus:ring-red-300' : ''}
              />
              {errors.interview_date && (
                <p className="text-red-500 text-sm">{errors.interview_date}</p>
              )}
            </div>

            {/* <div className="space-y-2 col-span-2">
              <Label htmlFor="feedBack" className="text-[var(--brand)]">
                Feedback
              </Label>
              <Textarea
                id="feedBack"
                name="feedBack"
                placeholder="Enter feedback"
                value={formData.feedBack}
                onChange={handleChange}
                className={errors.feedBack ? 'border-red-500 focus:ring-red-300' : ''}
                rows={3}
              />
              {errors.feedBack && <p className="text-red-500 text-sm">{errors.feedBack}</p>}
            </div>

            <div className="space-y-2 col-span-2">
              <div className="flex items-center space-x-2">
                <input
                  type="checkbox"
                  id="isComplete"
                  checked={formData.isComplete}
                  onChange={handleCompleteChange}
                  className="h-4 w-4 text-[var(--brand)] rounded border-gray-300 focus:ring-[var(--brand)]"
                />
                <Label htmlFor="isComplete" className="text-[var(--brand)]">
                  Mark as Complete
                </Label>
              </div>
            </div> */}
          </div>

          <DialogFooter className="pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                resetForm();
                setIsOpen(false);
              }}
              className="mr-2 border-gray-300 text-gray-700 hover:bg-gray-50"
            >
              Cancel
            </Button>
            <Button
              type="submit"
              className="bg-gradient-to-r from-[var(--brand)] to-[#1e3a6d] hover:from-[var(--brand)] hover:to-[var(--brand)] text-white"
            >
              Add Round
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
