'use client';
import {
  JSXElementConstructor,
  Key,
  ReactElement,
  ReactNode,
  ReactPortal,
  useEffect,
  useState,
} from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';
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
import { fetchAllUsers } from '../../store/action/users.action';
import { User } from '../../store/model';
import { getUserNameEmail } from '../../utils/user-name';

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
  esalary: string;
  csalary: string;
  noticeperiod: string;
  requirementId: string;
  candidateStatus: string;
  uploadedBy: string;
}

export default function CandidateFormAlone({
  setopen,
}: {
  setopen: React.Dispatch<React.SetStateAction<boolean>>;
}) {
  // Global state
  const { requirements } = useAppSelector((state: RootState) => state?.requirementsSelector);
  const { status } = useAppSelector((state: RootState) => state?.statusSelector);
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const { users } = useAppSelector((state: RootState) => state?.usersSelector);
const [showConfirm, setShowConfirm] = useState(false);
const [duplicateData, setDuplicateData] = useState<any[]>([]);
const [pendingFormData, setPendingFormData] = useState<any>(null);
  // Local state
  const [formData, setFormData] = useState<FormData>({
    source: '',
    date: '',
    candidateName: '',
    phoneNo: '',
    emailId: '',
    currentLocation: '',
    totalExp: '',
    relExp: '',
    skillSet: '',
    esalary: '',
    csalary: '',
    noticeperiod: '',
    requirementId: '',
    candidateStatus: '',
    uploadedBy: ''
  });
   
  // const [clients, setClients] = useState<any>(null);
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();
  const dispatch = useDispatch<AppDispatch>();
  const [errors, setErrors] = useState<FormData>({
    source: '',
    date: '',
    candidateName: '',
    phoneNo: '',
    emailId: '',
    currentLocation: '',
    totalExp: '',
    relExp: '',
    skillSet: '',
    esalary: '',
    csalary: '',
    noticeperiod: '',
    requirementId: '',
    candidateStatus: '',
    uploadedBy: ''
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (name === 'phoneNo' && value.length > 10) {
      return;
    } else {
      setFormData({
        ...formData,
        [name]: value,
      });
    }
  };

  // // Use effects
  // useEffect(() => {
  //   const filterCli = requirements.find(
  //     (req: RequirementLoop) => req.id === parseInt(formData.requirementId)
  //   );
  //   setClients(filterCli?.client);
  // }, [formData.requirementId, requirements]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const error = validateForm(formData);
    console.log("submit 1");
    
    if (Object.values(error).some((value) => value?.id ? value?.id !== '' : value !== '')) {
      return;
    }
    console.log("submit 2");
    
    const selectedStatus = status.find(
      (statusItem: { id: number; statusName: string }) =>
        statusItem.id === parseInt(formData.candidateStatus)
    );

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
      currentSalary: formData.csalary,
      expectedSalary: formData.esalary,
      noticePeriod: formData.noticeperiod,
      requirementDetails: {
        id: parseInt(formData.requirementId),
      },
      candidateStatus: {
        id: parseInt(formData.candidateStatus),
        statusName: selectedStatus?.statusName || '',
      },
      uploadedBy: { id: +formData?.uploadedBy },
      createdBy: {
        id: user?.id,
      },
    };

    try {
      console.log("test sumbit 1");
      
      const response: any = await dispatch(createCandidate(form_data)).unwrap();
      console.log(" test 2",response);
      

if (response?.warning) {
  const details = (response?.data || []) as any[];

  setDuplicateData(details);
  setPendingFormData(form_data);
  setShowConfirm(true);

  return; // stop execution
}

// ✅ SUCCESS
if (response?.success === true || response?.statusCode === 201) {
  console.log("submit 3");
  
  await showSuccessSnackbar(
    response?.message || 'Candidate created successfully'
  );
  dispatch(FetchAllCandidate());
  resetForm();
  setopen(false);
} 
// 🔴 BLOCK CASE
else if (response?.success === false) {
  await showErrorSnackbar(response?.message);
} 
else {
  await showErrorSnackbar(
    response?.message || 'Failed to create candidate'
  );
}
    } catch (error) {
      console.error('Error in candidate creation:', error);
      await showErrorSnackbar('An error occurred while creating the candidate');
    }
  };
const handleConfirmAdd = async () => {
  try {
    const response: any = await dispatch(
      createCandidate({
        ...pendingFormData,
        forceAdd: true,
      })
    ).unwrap();

    await showSuccessSnackbar(
      response?.message || 'Candidate created successfully'
    );

    dispatch(FetchAllCandidate());
    resetForm();
    setopen(false);
    setShowConfirm(false);
  } catch (error) {
    await showErrorSnackbar('Failed to create candidate');
  }
};
  const resetForm = () => {
    setFormData({
      source: '',
      date: '',
      candidateName: '',
      phoneNo: '',
      emailId: '',
      currentLocation: '',
      totalExp: '',
      relExp: '',
      skillSet: '',
      esalary: '',
      csalary: '',
      noticeperiod: '',
      requirementId: '',
      candidateStatus: '',
      uploadedBy: ''
    });

    const idSet = document.getElementById('candidate_id') as HTMLSelectElement;
    if (idSet) {
      idSet.value = '';
    }
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(String(email).toLowerCase());
  };

  const validateForm = (formDatas: FormData) => {
    const errors: FormData = {
      source: '',
      date: '',
      candidateName: '',
      phoneNo: '',
      emailId: '',
      currentLocation: '',
      totalExp: '',
      relExp: '',
      skillSet: '',
      esalary: '',
      csalary: '',
      noticeperiod: '',
      requirementId: '',
      candidateStatus: '',
      uploadedBy: ''
    };

    if (!formDatas.source) {
      errors.source = 'Please fill in the source name';
    }
    if (!formDatas.candidateName) {
      errors.candidateName = 'Please fill in the candidate name';
    }
    if (!formDatas.phoneNo) {
      errors.phoneNo = 'Please fill in the phone number';
    } else if (formDatas.phoneNo.length !== 10 || isNaN(Number(formDatas.phoneNo))) {
      errors.phoneNo = 'Please enter a valid phone number';
    }
    if (!formDatas.emailId) {
      errors.emailId = 'Please enter the email id';
    } else if (!validateEmail(formDatas.emailId)) {
      errors.emailId = 'Please enter a valid email id';
    }
    if (!formDatas.currentLocation) {
      errors.currentLocation = 'Please fill current location';
    }
    if (!formDatas.totalExp) {
      errors.totalExp = 'Please fill total experience';
    }
    if (!formDatas.relExp) {
      errors.relExp = 'Please fill the related experience';
    }
    if (!formDatas.skillSet) {
      errors.skillSet = 'Please fill the skill set';
    }
    if (!formDatas.esalary) {
      errors.esalary = 'Please fill the expected salary';
    }
    if (!formDatas.csalary) {
      errors.csalary = 'Please fill the current salary';
    }
    if (!formDatas.noticeperiod) {
      errors.noticeperiod = 'Please fill the notice period';
    }
    if (!formDatas.requirementId) {
      errors.requirementId = 'Please fill the requirement';
    }
    if (!formDatas.candidateStatus) {
      errors.candidateStatus = 'Please fill the candidate status';
    }
    if (!formDatas.uploadedBy) {
      errors.uploadedBy = 'Please Choose User';
    }

    setErrors(errors);
    return errors;
  };

  const validateField = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;

    if (value !== '') {
      setErrors((prevErrors) => ({
        ...prevErrors,
        [name]: '',
      }));
    }
  };

  const handleSelectChange = (value: string) => {
    setFormData({
      ...formData,
      requirementId: value,
    });

    // Clear the error for requirementId when selected
    setErrors((prevErrors) => ({
      ...prevErrors,
      requirementId: '',
    }));
  };

  const handleUploadSelectChange = (value: string) => {
    setFormData({
      ...formData,
      uploadedBy: value,
    });

    // Clear the error for requirementId when selected
    setErrors((prevErrors) => ({
      ...prevErrors,
      uploadedBy: '',
    }));
  };

  const handleCandidateChange = (value: string) => {
    setFormData({
      ...formData,
      candidateStatus: value,
    });

    // Clear the error for candidateStatus when selected
    setErrors((prevErrors) => ({
      ...prevErrors,
      candidateStatus: '',
    }));
  };

  useEffect(() => {
    dispatch(fetchStatusCategories());
    dispatch(fetchAllLocation());
    dispatch(fetchStatus());
    dispatch(FetchAllCandidate());
    dispatch(fetchAllUsers());
  }, [dispatch]);

  return (
    <>
      <div className="candidateformAlo">
        <form onSubmit={handleSubmit} className="space-y-6 flexform">
          <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
            <div className="space-y-2">
              <Label htmlFor="source">Source</Label>
              <Input
                id="source"
                name="source"
                type="text"
                placeholder="Enter the source"
                value={formData.source}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.source ? 'red' : '',
                }}
              />
              <span className="error">{errors?.source}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="date">Profile shared Date</Label>
              <Input
                id="date"
                name="date"
                type="date"
                placeholder="Enter the date"
                value={formData.date}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
              />
              <span className="error">{errors?.date}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="candidateName">Candidate Name</Label>
              <Input
                id="candidateName"
                name="candidateName"
                value={formData.candidateName}
                type="text"
                placeholder="Enter your name"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.candidateName ? 'red' : '',
                }}
              />
              <span className="error">{errors?.candidateName}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="phoneNo">Phone No</Label>
              <Input
                id="phoneNo"
                name="phoneNo"
                type="number"
                value={formData.phoneNo}
                placeholder="Enter your number"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.phoneNo ? 'red' : '',
                }}
              />
              <span className="error">{errors?.phoneNo}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="emailId">Email ID</Label>
              <Input
                id="emailId"
                name="emailId"
                type="email"
                value={formData.emailId}
                placeholder="Enter your email"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.emailId ? 'red' : '',
                }}
              />
              <span className="error">{errors?.emailId}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="currentLocation">Current Location</Label>
              <Input
                id="currentLocation"
                name="currentLocation"
                type="text"
                placeholder="Enter your current location"
                value={formData.currentLocation}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.currentLocation ? 'red' : '',
                }}
              />
              <span className="error">{errors?.currentLocation}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="totalExp">Total Exp</Label>
              <Input
                id="totalExp"
                name="totalExp"
                placeholder="Enter your total experience"
                value={formData.totalExp}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.totalExp ? 'red' : '',
                }}
              />
              <span className="error">{errors?.totalExp}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="relExp">Rel Exp</Label>
              <Input
                id="relExp"
                name="relExp"
                value={formData.relExp}
                placeholder="Enter your related experience"
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.relExp ? 'red' : '',
                }}
              />
              <span className="error">{errors?.relExp}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="skillSet">Skill Set</Label>
              <Input
                id="skillSet"
                name="skillSet"
                type="text"
                placeholder="Enter your skills"
                value={formData.skillSet}
                onChange={(e) => {
                  handleChange(e);
                  validateField(e);
                }}
                style={{
                  borderColor: errors?.skillSet ? 'red' : '',
                }}
              />
              <span className="error">{errors?.skillSet}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="requirement_id">Requirement</Label>
              <div id="requirement_id" className={errors?.requirementId ? 'select-error' : ''}>
                <Select
                  value={formData.requirementId ?? ''}
                  name="requirement_id"
                  onValueChange={handleSelectChange}
                >
                  <SelectTrigger className="fullwid">
                    <SelectValue placeholder="Select Requirement details" />
                  </SelectTrigger>
                  <SelectContent>
                    {requirements &&
                      requirements.map((requirement: RequirementLoop) => {
                        if (requirement.isActive) {
                          return (
                            <SelectItem key={requirement.id} value={String(requirement.id)}>
                              {(requirement?.client?.clientProfile?.clientName ??
                                'Client') +
                                ' · ' +
                                requirement?.positionDetails?.positionName +
                                ' · ' +
                                requirement?.relExp +
                                ' yrs'}
                            </SelectItem>
                          );
                        }
                        return null;
                      })}
                  </SelectContent>
                </Select>
              </div>
              <span className="error">{errors?.requirementId}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="csalary">Current salary</Label>
              <Input
                id="csalary"
                name="csalary"
                type="text"
                placeholder="Enter current salary"
                value={formData.csalary}
                onChange={(e) => {
                  validateField(e);
                  handleChange(e);
                }}
                style={{
                  borderColor: errors?.csalary ? 'red' : '',
                }}
              />
              <span className="error">{errors?.csalary}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="esalary">Expected salary</Label>
              <Input
                id="esalary"
                name="esalary"
                type="text"
                placeholder="Enter expected salary"
                value={formData.esalary}
                onChange={(e) => {
                  validateField(e);
                  handleChange(e);
                }}
                style={{
                  borderColor: errors?.esalary ? 'red' : '',
                }}
              />
              <span className="error">{errors?.esalary}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="noticeperiod">Notice period</Label>
              <Input
                id="noticeperiod"
                name="noticeperiod"
                type="text"
                placeholder="Enter notice period"
                value={formData.noticeperiod}
                onChange={(e) => {
                  validateField(e);
                  handleChange(e);
                }}
                style={{
                  borderColor: errors?.noticeperiod ? 'red' : '',
                }}
              />
              <span className="error">{errors?.noticeperiod}</span>
            </div>
            <div className="space-y-2 md:col-span-1">
              <Label htmlFor="candidateStatus">Candidate Status</Label>
              {/* <div className='labelflx'>
                <Label htmlFor="candidateStatus">Candidate Status</Label>
                    <div className='labebtn'><button onClick={(e)=> handleAddStatus(e)}><CirclePlus /></button></div>
                </div> */}

              <div id="candidate_id" className={errors?.candidateStatus ? 'select-error' : ''}>
                <Select
                  value={formData.candidateStatus ?? ''}
                  // style={{

                  // }}
                  name="candidate_id"
                  onValueChange={handleCandidateChange}
                >
                  <SelectTrigger className="fullwid">
                    <SelectValue placeholder="Select candidate status" />
                  </SelectTrigger>
                  <SelectContent>
                    {status.length > 0 &&
                      status.map(
                        (
                          statusItem: {
                            // eslint-disable-next-line
                            id: any;
                            statusName:
                            | string
                            | number
                            | boolean
                            // eslint-disable-next-line
                            | ReactElement<any, string | JSXElementConstructor<any>>
                            | Iterable<ReactNode>
                            | ReactPortal
                            | null
                            | undefined;
                          },
                          index: Key | null | undefined
                        ) => (
                          <SelectItem key={index} value={String(statusItem?.id)}>
                            {statusItem?.statusName}
                          </SelectItem>
                        )
                      )}
                  </SelectContent>
                </Select>
              </div>
              <span className="error">{errors?.candidateStatus}</span>
            </div>
            <div className="space-y-2">
              <Label htmlFor="uploaded_id">Uploaded By</Label>
              <div id="uploaded_id" className={errors?.uploadedBy ? 'select-error' : ''}>
                <Select
                  value={formData?.uploadedBy ?? ''}
                  name="uploaded_id"
                  onValueChange={handleUploadSelectChange}
                >
                  <SelectTrigger className="fullwid">
                    <SelectValue placeholder="Select User" />
                  </SelectTrigger>
                  <SelectContent>
                    {users &&
                      users.map((user: User) => {
                        return (
                          <SelectItem key={user?.id} value={String(user?.id)}>
                            {getUserNameEmail(user)}
                          </SelectItem>
                        );

                      })}
                  </SelectContent>
                </Select>
              </div>
              <span className="error">{errors?.uploadedBy}</span>
            </div>
          </div>
          <Button type="submit" className="w-full md:w-auto">
            Submit
          </Button>
        </form>

        <CustomizedSnackbars
          open={snackbarState.open}
          handleClose={handleSnackbarClose}
          message={snackbarState.message}
          severity={snackbarState.severity}
        />
      </div>
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="text-red-600">
        ⚠️ Duplicate Candidate Found
      </DialogTitle>
    </DialogHeader>

    <div className="space-y-2 text-sm">
      <p>This candidate already exists for:</p>

      {duplicateData.map((d, index) => (
        <div key={index} className="p-2 border rounded bg-gray-50">
          {d.client} - {d.requirement}
        </div>
      ))}
    </div>

    <DialogFooter>
      <Button
        variant="outline"
        onClick={() => setShowConfirm(false)}
      >
        Cancel
      </Button>

      <Button onClick={handleConfirmAdd}>
        Add Anyway
      </Button>
    </DialogFooter>
  </DialogContent>
</Dialog>
    </>
  );
}
