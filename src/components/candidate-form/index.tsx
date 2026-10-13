'use client';
import { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../../components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import { Label } from '../../components/ui/label';
import { AppDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { RequirementLoop } from '../../store/model/requirement-details.types';
import { useDispatch } from 'react-redux';
import { fetchStatusCategories } from '../../store/action/status-category.action';
import { fetchAllLocation } from '../../store/action/location.action';
import { fetchStatus } from '../../store/action/status.action';
import { createCandidate, FetchAllCandidate } from '../../store/action/candidate.action';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import { updateGapAnalysis } from '../../store/action/gap-analysis.action';

interface CandidateFormProps {
  isOpen: boolean;
  onClose: () => void;
}

interface FormData {
  source: string;
  date: string;
  candidateName: string;
  phoneNo: string;
  emailId: string;
  currentLocation: string;
  totalExp: string;
  relExp: string;
  skillSet: string;
  requirementId: string;
  candidateStatus: string;
  currentSalary: string;
  expectedSalary: string;
  noticePeriod: string;
}

const initialFormData: FormData = {
  source: '',
  date: '',
  candidateName: '',
  phoneNo: '',
  emailId: '',
  currentLocation: '',
  totalExp: '',
  relExp: '',
  skillSet: '',
  requirementId: '',
  candidateStatus: '',
  currentSalary: '',
  expectedSalary: '',
  noticePeriod: '',
};

export default function CandidateForm({ isOpen, onClose }: CandidateFormProps) {
  // Global state
  const { requirements } = useAppSelector((state: RootState) => state?.requirementsSelector);
  const {
    status,
  }: {
    status: { id: number; categoryName: string; status: { id: number; statusName: string }[] }[];
  } = useAppSelector((state: RootState) => state?.statusSelector);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);

  // Local state
  const [formData, setFormData] = useState<FormData>(initialFormData);
  // eslint-disable-next-line
  const [clients, setClients] = useState<any>();
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const [filteredStatus] = useState(status);
  const [errors, setErrors] = useState<FormData>(initialFormData);
  const [disable, setDisable] = useState(true);

  useEffect(() => {
    dispatch(fetchStatusCategories());
    dispatch(fetchAllLocation());
    dispatch(fetchStatus());
    dispatch(FetchAllCandidate());
  }, [dispatch]);

  useEffect(() => {
    if (filteredStatus.length > 0) {
      setDisable(false);
    } else {
      setDisable(true);
    }
  }, [filteredStatus]);

  useEffect(() => {
    const filterCli = requirements.find(
      (req: RequirementLoop) => req.id === parseInt(formData.requirementId)
    );
    setClients(filterCli?.client);
  }, [formData.requirementId, requirements]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNo' && value.length > 10) {
      return;
    }

    setFormData({
      ...formData,
      [name]: value,
    });

    // Validate field as user types
    validateField(e);
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      requirementId: value,
    });

    // Clear requirement error when selecting
    setErrors((prev) => ({
      ...prev,
      requirementId: '',
    }));
  };

  const handleCandidateChange = (value: string) => {
    setFormData({
      ...formData,
      candidateStatus: String(value),
    });

    // Clear candidate status error when selecting
    setErrors((prev) => ({
      ...prev,
      candidateStatus: '',
    }));
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email).toLowerCase());
  };

  const validateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value === '') {
      return; // Skip validation for empty fields during typing
    }

    let errorMessage = '';

    switch (name) {
      case 'phoneNo':
        if (value.length !== 10 || isNaN(Number(value))) {
          errorMessage = 'Please enter a valid 10-digit phone number';
        }
        break;
      case 'emailId':
        if (!validateEmail(value)) {
          errorMessage = 'Please enter a valid email address';
        }
        break;
      default:
        break;
    }

    setErrors((prev) => ({
      ...prev,
      [name]: errorMessage,
    }));
  };

  const validateForm = (formData: FormData) => {
    const newErrors: FormData = { ...initialFormData };

    // Required field validation
    Object.entries(formData).forEach(([key, value]) => {
      if (!value) {
        newErrors[key as keyof FormData] =
          `Please fill in the ${key.replace(/([A-Z])/g, ' $1').toLowerCase()}`;
      }
    });

    // Special validations
    if (formData.phoneNo && (formData.phoneNo.length !== 10 || isNaN(Number(formData.phoneNo)))) {
      newErrors.phoneNo = 'Please enter a valid 10-digit phone number';
    }

    if (formData.emailId && !validateEmail(formData.emailId)) {
      newErrors.emailId = 'Please enter a valid email address';
    }

    setErrors(newErrors);
    return newErrors;
  };

  // Fix for the TypeScript error in the handleSubmit function
  // The key change is adding the statusName to the candidateStatus object

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const validationErrors = validateForm(formData);
    if (Object.values(validationErrors).some((value) => value !== '')) {
      return;
    }

    // Find the selected status to get its name
    const selectedStatus = status
      .flatMap((category) => category.status)
      .find((s) => s.id === parseInt(formData.candidateStatus));

    const form_data = {
      source: formData.source,
      date: formData.date,
      candidateName: formData.candidateName,
      primaryContact: formData.phoneNo,
      emailId: formData.emailId,
      candidateLocation: formData.currentLocation,
      totalExp: formData.totalExp,
      relExp: formData.relExp,
      skillSet: formData.skillSet,
      requirementDetails: {
        id: parseInt(formData.requirementId),
      },
      candidateStatus: {
        id: parseInt(formData.candidateStatus),
        statusName: selectedStatus?.statusName || '', // Add the status name from the selected status
      },
      createdBy: {
        id: user?.id,
      },
      currentSalary: formData.currentSalary,
      expectedSalary: formData.expectedSalary,
      noticePeriod: formData.noticePeriod,
      uploadedBy: {
        id: 1
      }
    };

    try {
let response: any = await dispatch(createCandidate(form_data)).unwrap();
  // 🔴 HANDLE WARNING
  if (response?.warning) {
    const details = (response?.data || []) as any[];

const detailsText =
  details.length > 0
    ? details.map((d) => `${d.client} - ${d.requirement}`).join('\n')
    : 'Already exists';

    const confirmAdd = window.confirm(
      `Candidate already exists for:\n${detailsText}\n\nDo you want to continue?`
    );

    if (!confirmAdd) return;

    // 🔥 SECOND CALL WITH forceAdd
    response = await dispatch(
      createCandidate({
        ...form_data,
        forceAdd: true,
      })
    ).unwrap();
  }

  const candidateId = response?.data?.id;

  // 🔴 GAP ANALYSIS (keep your logic)
  if (clients && candidateId) {
    await dispatch(
      updateGapAnalysis({
        payload: {
          client: clients,
          oldStatus: 0,
          newStatus: parseInt(formData.candidateStatus),
          candidate: {
            id: candidateId,
          },
          updatedBy: {
            id: user?.id,
          },
        },
      })
    ).unwrap();
  }

  // ✅ SUCCESS
  if (response?.statusCode === 201 || response?.success === true) {
    await showSuccessSnackbar(
      response?.message ?? 'Candidate created successfully'
    );
    dispatch(FetchAllCandidate());
    setFormData(initialFormData);
    onClose();
  } else if (response?.success === false) {
    // 🔴 BLOCK CASE
    await showErrorSnackbar(response?.message);
  } else {
    await showErrorSnackbar(
      response?.message ?? 'Failed to create candidate'
    );
  }

} catch (error) {
  console.error('Error creating candidate:', error);
  await showErrorSnackbar('An error occurred while creating the candidate');
}
  };

  const activeRequirements = requirements?.filter((req: RequirementLoop) => req.isActive) || [];

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[1100px]">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold">Candidate Profile</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 flexform">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            {/* Source field */}
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                type="text"
                placeholder="Enter the source"
                value={formData.source}
                onChange={handleChange}
              />
              {errors.source && <span className="text-red-500 text-sm">{errors.source}</span>}
            </div>

            {/* Date field */}
            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                placeholder="Enter the date"
                value={formData.date}
                onChange={handleChange}
              />
              {errors.date && <span className="text-red-500 text-sm">{errors.date}</span>}
            </div>

            {/* Candidate Name field */}
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input
                id="candidateName"
                name="candidateName"
                value={formData.candidateName}
                type="text"
                placeholder="Enter candidate name"
                onChange={handleChange}
              />
              {errors.candidateName && (
                <span className="text-red-500 text-sm">{errors.candidateName}</span>
              )}
            </div>

            {/* Phone Number field */}
            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone No</Label>
              <Input
                id="phoneNo"
                name="phoneNo"
                type="number"
                value={formData.phoneNo}
                placeholder="Enter phone number"
                onChange={handleChange}
              />
              {errors.phoneNo && <span className="text-red-500 text-sm">{errors.phoneNo}</span>}
            </div>

            {/* Email field */}
            <div className="space-y-2">
              <Label htmlFor="emailId">Email ID</Label>
              <Input
                id="emailId"
                name="emailId"
                type="email"
                value={formData.emailId}
                placeholder="Enter email address"
                onChange={handleChange}
              />
              {errors.emailId && <span className="text-red-500 text-sm">{errors.emailId}</span>}
            </div>

            {/* Current Location field */}
            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Input
                id="currentLocation"
                name="currentLocation"
                type="text"
                placeholder="Enter current location"
                value={formData.currentLocation}
                onChange={handleChange}
              />
              {errors.currentLocation && (
                <span className="text-red-500 text-sm">{errors.currentLocation}</span>
              )}
            </div>

            {/* Total Experience field */}
            <div className="space-y-2">
              <Label htmlFor="totalExp">Total Experience</Label>
              <Input
                id="totalExp"
                name="totalExp"
                placeholder="Enter total experience"
                value={formData.totalExp}
                onChange={handleChange}
              />
              {errors.totalExp && <span className="text-red-500 text-sm">{errors.totalExp}</span>}
            </div>

            {/* Relevant Experience field */}
            <div className="space-y-2">
              <Label htmlFor="relExp">Relevant Experience</Label>
              <Input
                id="relExp"
                name="relExp"
                value={formData.relExp}
                placeholder="Enter relevant experience"
                onChange={handleChange}
              />
              {errors.relExp && <span className="text-red-500 text-sm">{errors.relExp}</span>}
            </div>

            {/* Skill Set field */}
            <div className="space-y-2">
              <Label htmlFor="skillSet">Skill Set</Label>
              <Input
                id="skillSet"
                name="skillSet"
                type="text"
                placeholder="Enter skill set"
                value={formData.skillSet}
                onChange={handleChange}
              />
              {errors.skillSet && <span className="text-red-500 text-sm">{errors.skillSet}</span>}
            </div>

            {/* Current Salary field */}
            <div className="space-y-2">
              <Label htmlFor="currentSalary">Current Salary</Label>
              <Input
                id="currentSalary"
                name="currentSalary"
                type="text"
                placeholder="Enter current salary"
                value={formData.currentSalary}
                onChange={handleChange}
              />
              {errors.currentSalary && (
                <span className="text-red-500 text-sm">{errors.currentSalary}</span>
              )}
            </div>

            {/* Expected Salary field */}
            <div className="space-y-2">
              <Label htmlFor="expectedSalary">Expected Salary</Label>
              <Input
                id="expectedSalary"
                name="expectedSalary"
                type="text"
                placeholder="Enter expected salary"
                value={formData.expectedSalary}
                onChange={handleChange}
              />
              {errors.expectedSalary && (
                <span className="text-red-500 text-sm">{errors.expectedSalary}</span>
              )}
            </div>

            {/* Notice Period field */}
            <div className="space-y-2">
              <Label htmlFor="noticePeriod">Notice Period</Label>
              <Input
                id="noticePeriod"
                name="noticePeriod"
                type="text"
                placeholder="Enter notice period"
                value={formData.noticePeriod}
                onChange={handleChange}
              />
              {errors.noticePeriod && (
                <span className="text-red-500 text-sm">{errors.noticePeriod}</span>
              )}
            </div>

            {/* Requirement ID select field */}
            <div className="space-y-2">
              <Label htmlFor="requirement_id">Requirement ID</Label>
              <div className={errors?.requirementId ? 'border-red-500 rounded-md' : ''}>
                <Select
                  name="requirement_id"
                  onValueChange={handleSelectChange}
                  value={formData.requirementId}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select Requirement details" />
                  </SelectTrigger>
                  <SelectContent>
                    {activeRequirements.map((requirement: RequirementLoop) => (
                      <SelectItem key={requirement.id} value={String(requirement.id)}>
                        {(requirement?.client?.clientProfile?.clientName ??
                          'Client') +
                          ' · ' +
                          requirement?.positionDetails?.positionName +
                          ' · ' +
                          requirement?.relExp +
                          ' yrs'}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              {errors.requirementId && (
                <span className="text-red-500 text-sm">{errors.requirementId}</span>
              )}
            </div>

            {/* Candidate Status select field */}
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="candidateStatus">Candidate Status</Label>
              <div
                className={`${disable ? 'opacity-50 pointer-events-none' : ''} ${errors?.candidateStatus ? 'border-red-500 rounded-md' : ''}`}
              >
                <Select
                  name="candidate_id"
                  onValueChange={handleCandidateChange}
                  value={formData.candidateStatus}
                >
                  <SelectTrigger className="w-full">
                    <SelectValue placeholder="Select candidate status" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredStatus.map((category, categoryIndex) =>
                      category.status.map((statusItem, statusIndex) => (
                        <SelectItem
                          key={`${categoryIndex}-${statusIndex}`}
                          value={String(statusItem?.id)}
                        >
                          {statusItem?.statusName}
                        </SelectItem>
                      ))
                    )}
                  </SelectContent>
                </Select>
              </div>
              {errors.candidateStatus && (
                <span className="text-red-500 text-sm">{errors.candidateStatus}</span>
              )}
            </div>
          </div>

          <DialogFooter>
            <Button type="submit" className="w-full md:w-auto">
              Submit
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </Dialog>
  );
}
