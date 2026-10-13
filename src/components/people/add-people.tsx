// 'use client';
// import { useEffect, useState } from 'react';

// import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../ui/select';
// import { Button } from '../../components/ui/button';
// import { Input } from '../../components/ui/input';
// import { Label } from '../../components/ui/label';
// import { AppDispatch, useAppSelector } from '../../store';
// import { RootState } from '../../store/reducers';
// import { RequirementLoop } from '../../store/model/requirement-details.types';
// import { useDispatch } from 'react-redux';
// import { fetchStatusCategories } from '../../store/action/status-category.action';
// import { fetchAllLocation } from '../../store/action/location.action';
// import { fetchStatus } from '../../store/action/status.action';
// import { createCandidate } from '../../store/action/candidate.action';
// import { useSnackbar } from '../../utils/snackbar-function';
// import CustomizedSnackbars from '../customized-snackbar';
// import { FetchAllCandidate } from '../../store/action/candidate.action';
// import { updateGapAnalysis } from '../../store/action/gap-analysis.action';

// interface FormData {
//   source: string;
//   date: string;
//   candidateName: string;
//   phoneNo: string;
//   emailId: string;
//   currentLocation: string;
//   totalExp: string;
//   relExp: string;
//   skillSet: string;
//   esalary: string;
//   csalary: string;
//   noticeperiod: string;
//   requirementId: string;
//   candidateStatus: string;
// }

// export default function CandidateFormAlone({
//   setopen,
// }: {
//   setopen: React.Dispatch<React.SetStateAction<boolean>>;
// }) {
//   //global state
//   const { requirements } = useAppSelector((state: RootState) => state?.requirementsSelector);
//   const {
//     status,
//   }: {
//     status: { id: number; categoryName: string; status: { id: number; statusName: string }[] }[];
//   } = useAppSelector((state: RootState) => state?.statusSelector);
//   const { user } = useAppSelector((state: RootState) => state?.authSelector);

//   //local state
//   const [formData, setFormData] = useState({
//     source: '',
//     date: '',
//     candidateName: '',
//     phoneNo: '',
//     emailId: '',
//     currentLocation: '',
//     totalExp: '',
//     relExp: '',
//     skillSet: '',
//     esalary: '',
//     csalary: '',
//     noticeperiod: '',
//     requirementId: '',
//     candidateStatus: '',
//   });
//   // eslint-disable-next-line
//   const [clients, setClients] = useState<any>();
//   const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
//     useSnackbar();
//   const dispatch = useDispatch<AppDispatch>();
//   const [filteredStatus, setFilteredStatus] = useState(status);
//   const [errors, setErrors] = useState<FormData>({
//     source: '',
//     date: '',
//     candidateName: '',
//     phoneNo: '',
//     emailId: '',
//     currentLocation: '',
//     totalExp: '',
//     relExp: '',
//     skillSet: '',
//     esalary: '',
//     csalary: '',
//     noticeperiod: '',
//     requirementId: '',
//     candidateStatus: '',
//   });
//   const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;

//     if (name === 'phoneNo' && value.length > 10) {
//       return;
//     } else {
//       setFormData({
//         ...formData,
//         [name]: value,
//       });
//     }
//   };

//   // Use effects
//   useEffect(() => {
//     const filterCli = requirements.find(
//       (req: RequirementLoop) => req.id === parseInt(formData.requirementId)
//     );
//     setClients(filterCli?.client);
//   }, [formData.requirementId]);
//   const handleSubmit = async (e: React.FormEvent) => {
//     e.preventDefault();
//     const error = validateForm(formData);
//     console.log(error);
//     if (Object.values(error).some((value) => value !== '')) {
//       return;
//     }
//     const form_data = {
//       source: formData.source,
//       date: formData.date,
//       candidateName: formData.candidateName,
//       primaryContact: formData.phoneNo,
//       emailId: formData.emailId,
//       candidateLocation: formData.currentLocation,
//       totalExp: formData.totalExp,
//       relExp: formData.relExp,
//       skillSet: formData.skillSet,
//       currentSalary: formData.csalary,
//       expectedSalary: formData.esalary,
//       noticePeriod: formData.noticeperiod,
//       requirementDetails: {
//         id: parseInt(formData.requirementId),
//       },
//       candidateStatus: {
//         id: parseInt(formData.candidateStatus),
//       },
//       createdBy: {
//         id: user?.id,
//       },
//     };
//     setFormData({
//       source: '',
//       date: '',
//       candidateName: '',
//       phoneNo: '',
//       emailId: '',
//       currentLocation: '',
//       totalExp: '',
//       relExp: '',
//       skillSet: '',
//       esalary: '',
//       csalary: '',
//       noticeperiod: '',
//       requirementId: '',
//       candidateStatus: '',
//     });

//     try {
//       const response = await dispatch(createCandidate(form_data)).unwrap();
//       const CandidateID = response?.data?.id;
//       if (CandidateID && clients) {
//         await dispatch(
//           updateGapAnalysis({
//             payload: {
//               client: clients,
//               oldStatus: 0,
//               newStatus: parseInt(formData.candidateStatus),
//               candidate: {
//                 id: CandidateID,
//               },
//               updatedBy: {
//                 id: user?.id,
//               },
//             },
//           })
//         ).unwrap();
//       }
//       if (response?.statusCode === 201) {
//         await showSuccessSnackbar(response?.message ?? 'Candidate created successfully');
//         dispatch(FetchAllCandidate());
//         setFormData({
//           source: '',
//           date: '',
//           candidateName: '',
//           phoneNo: '',
//           emailId: '',
//           currentLocation: '',
//           totalExp: '',
//           relExp: '',
//           skillSet: '',
//           esalary: '',
//           csalary: '',
//           noticeperiod: '',
//           requirementId: '',
//           candidateStatus: '',
//         });
//         setFilteredStatus(status);
//         setopen(false);
//         const idSet = document.getElementById('candidate_id') as HTMLSelectElement;

//         if (idSet) {
//           idSet.value = '';
//         }
//       } else {
//         await showErrorSnackbar(response?.message ?? 'Failed to create candidate');
//       }
//     } catch (error) {
//       console.log(error);
//     }
//   };
//   const validateEmail = (email: string): boolean => {
//     const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
//     return emailRegex.test(String(email).toLowerCase());
//   };
//   const validateForm = (formDatas: FormData) => {
//     const errors: {
//       source: string;
//       country: string;
//       candidateName: string;
//       phoneNo: string;
//       date: string;
//       emailId: string;
//       currentLocation: string;
//       totalExp: string;
//       relExp: string;
//       skillSet: string;
//       esalary: string;
//       csalary: string;
//       noticeperiod: string;
//       requirementId: string;
//       candidateStatus: string;
//     } = {
//       source: '',
//       country: '',
//       candidateName: '',
//       phoneNo: '',
//       currentLocation: '',
//       date: '',
//       emailId: '',
//       totalExp: '',
//       relExp: '',
//       skillSet: '',
//       esalary: '',
//       csalary: '',
//       noticeperiod: '',
//       requirementId: '',
//       candidateStatus: '',
//     };

//     if (!formDatas.source) {
//       errors.source = 'Please fill in the source name';
//     }
//     if (!formDatas.candidateName) {
//       errors.candidateName = 'Please fill in the candidate name';
//     }
//     if (!formDatas.phoneNo) {
//       errors.phoneNo = 'Please fill in the phone number';
//     } else if (formDatas.phoneNo.length !== 10 || isNaN(Number(formDatas.phoneNo))) {
//       errors.phoneNo = 'Please enter a valid phone number';
//     }
//     if (!formData.emailId) {
//       errors.emailId = 'Please enter the email id ';
//     } else if (!validateEmail(formData.emailId)) {
//       errors.emailId = 'Please enter the valid email id ';
//     }
//     if (!formDatas.currentLocation) {
//       errors.currentLocation = 'Please fill current location';
//     }
//     if (!formDatas.totalExp) {
//       errors.totalExp = 'Please fill total experience';
//     }
//     if (!formDatas.relExp) {
//       errors.relExp = 'Please fill the related experience';
//     }
//     if (!formDatas.skillSet) {
//       errors.skillSet = 'Please fill the skill set';
//     }
//     if (!formDatas.esalary) {
//       errors.esalary = 'Please fill the expected salary';
//     }
//     if (!formDatas.csalary) {
//       errors.csalary = 'Please fill the current salary';
//     }
//     if (!formDatas.noticeperiod) {
//       errors.noticeperiod = 'Please fill the notice period';
//     }
//     if (!formDatas.requirementId) {
//       errors.requirementId = 'Please fill the requirement';
//     }
//     if (!formDatas.candidateStatus) {
//       errors.candidateStatus = 'Please fill the candidate status';
//     }

//     setErrors(errors);
//     return errors;
//   };
//   const validateField = (e: React.ChangeEvent<HTMLInputElement>) => {
//     const { name, value } = e.target;
//     switch (name) {
//       case 'source':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             source: '',
//           }));
//         }
//         break;
//       case 'date':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             date: '',
//           }));
//         }
//         break;

//       case 'candidateName':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             candidateName: '',
//           }));
//         }
//         break;

//       case 'phoneNo':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             phoneNo: '',
//           }));
//         }
//         break;

//       case 'emailId':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             emailId: '',
//           }));
//         }
//         break;

//       case 'currentLocation':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             currentLocation: '',
//           }));
//         }
//         break;

//       case 'totalExp':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             totalExp: '',
//           }));
//         }
//         break;

//       case 'relExp':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             relExp: '',
//           }));
//         }
//         break;

//       case 'skillSet':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             skillSet: '',
//           }));
//         }
//         break;
//       case 'requirementId':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             requirementId: '',
//           }));
//         }
//         break;

//       case 'candidateStatus':
//         if (value !== '') {
//           setErrors((prevErrors) => ({
//             ...prevErrors,
//             candidateStatus: '',
//           }));
//         }
//         break;

//       default:
//         break;
//     }
//   };
//   const handleSelectChange = (value: string) => {
//     setFormData({
//       ...formData,
//       requirementId: value,
//     });
//   };

//   const handleCandidateChange = (value: string) => {
//     setFormData({
//       ...formData,
//       candidateStatus: String(value),
//     });
//   };

//   useEffect(() => {
//     dispatch(fetchStatusCategories());
//     dispatch(fetchAllLocation());
//     dispatch(fetchStatus());
//     dispatch(FetchAllCandidate());
//   }, [dispatch]);

//   return (
//     <>
//       <div className="candidateformAlo">
//         <form onSubmit={handleSubmit} className="space-y-6 flexform">
//           <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
//             <div className="space-y-2">
//               <Label htmlFor="source">Source</Label>
//               <Input
//                 id="source"
//                 name="source"
//                 type="text"
//                 placeholder="Enter the source"
//                 value={formData.source}
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.source ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.source}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="date">Profile Shared Date</Label>
//               <Input
//                 id="date"
//                 name="date"
//                 type="date"
//                 placeholder="Enter the date"
//                 value={formData.date}
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//               />
//               <span className="error">{errors?.date}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="candidateName">Candidate Name</Label>
//               <Input
//                 id="candidateName"
//                 name="candidateName"
//                 value={formData.candidateName}
//                 type="text"
//                 placeholder="Enter your name"
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.candidateName ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.candidateName}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="phoneNo">Phone No</Label>
//               <Input
//                 id="phoneNo"
//                 name="phoneNo"
//                 type="number"
//                 value={formData.phoneNo}
//                 placeholder="Enter your number"
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.phoneNo ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.phoneNo}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="emailId">Email ID</Label>
//               <Input
//                 id="emailId"
//                 name="emailId"
//                 type="email"
//                 value={formData.emailId}
//                 placeholder="Enter your email"
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.emailId ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.emailId}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="currentLocation">Current Location</Label>

//               <Input
//                 id="currentLocation"
//                 name="currentLocation"
//                 type="text"
//                 placeholder="Enter your current location"
//                 value={formData.currentLocation}
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.currentLocation ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.currentLocation}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="totalExp">Total Exp</Label>
//               <Input
//                 id="totalExp"
//                 name="totalExp"
//                 placeholder="Enter your total experience"
//                 value={formData.totalExp}
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.totalExp ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.totalExp}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="relExp">Rel Exp</Label>
//               <Input
//                 id="relExp"
//                 name="relExp"
//                 value={formData.relExp}
//                 placeholder="Enter your related experience"
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//               />
//               <span className="error">{errors?.relExp}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="skillSet">Skill Set</Label>
//               <Input
//                 id="skillSet"
//                 name="skillSet"
//                 type="text"
//                 placeholder="Enter your related experience"
//                 value={formData.skillSet}
//                 onChange={(e) => {
//                   handleChange(e);
//                   validateField(e);
//                 }}
//                 style={{
//                   borderColor: errors?.csalary ? 'red' : '',
//                 }}
//               />
//               <span className="error">{errors?.skillSet}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="requirement_id">Requirement ID</Label>

//               <div id="requirement_id" className={errors?.requirementId ? 'select-error' : ''}>
//                 <Select
//                   value={formData.requirementId ?? ''}
//                   name="requirement_id"
//                   onValueChange={handleSelectChange}
//                 >
//                   <SelectTrigger className="fullwid">
//                     <SelectValue placeholder="Select Requirement details" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {requirements &&
//                       requirements.map((requirement: RequirementLoop) => {
//                         if (requirement.isActive) {
//                           return (
//                             <SelectItem key={requirement.id} value={String(requirement.id)}>
//                               {requirement?.client?.clientProfile?.clientName +
//                                 ' - ' +
//                                 requirement?.positionDetails?.positionName +
//                                 ' - ' +
//                                 requirement?.relExp +
//                                 ' yrs'}
//                             </SelectItem>
//                           );
//                         }
//                         return null;
//                       })}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <span className="error">{errors?.requirementId}</span>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="csalary">Current salary</Label>
//               <Input
//                 id="csalary"
//                 name="csalary"
//                 type="text"
//                 placeholder="Enter the number of current salary"
//                 value={formData.csalary}
//                 onChange={(e) => {
//                   validateField(e);
//                   handleChange(e);
//                 }}
//                 style={{
//                   borderColor: errors?.csalary ? 'red' : '',
//                 }}
//               />
//               <div className="error" style={{ color: 'red' }}>
//                 {' '}
//                 <span>{errors?.csalary}</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="esalary">Expected salary</Label>
//               <Input
//                 id="esalary"
//                 name="esalary"
//                 type="text"
//                 placeholder="Enter the number of expected salary"
//                 value={formData.esalary}
//                 onChange={(e) => {
//                   validateField(e);
//                   handleChange(e);
//                 }}
//                 style={{
//                   borderColor: errors?.esalary ? 'red' : '',
//                 }}
//               />
//               <div className="error" style={{ color: 'red' }}>
//                 {' '}
//                 <span>{errors?.esalary}</span>
//               </div>
//             </div>
//             <div className="space-y-2">
//               <Label htmlFor="noticeperiod">Notice period</Label>
//               <Input
//                 id="noticeperiod"
//                 name="noticeperiod"
//                 type="text"
//                 placeholder="Enter the period of notice"
//                 value={formData.noticeperiod}
//                 onChange={(e) => {
//                   validateField(e);
//                   handleChange(e);
//                 }}
//                 style={{
//                   borderColor: errors?.noticeperiod ? 'red' : '',
//                 }}
//               />
//               <div className="error" style={{ color: 'red' }}>
//                 {' '}
//                 <span>{errors?.noticeperiod}</span>
//               </div>
//             </div>
//             <div className="space-y-2 md:col-span-1">
//               <Label htmlFor="candidateStatus">Candidate Status</Label>
//               {/* <div className='labelflx'>
//                 <Label htmlFor="candidateStatus">Candidate Status</Label>
//                     <div className='labebtn'><button onClick={(e)=> handleAddStatus(e)}><CirclePlus /></button></div>
//                 </div> */}

//               <div id="candidate_id">
//                 <Select
//                   value={formData.candidateStatus ?? ''}
//                   // style={{

//                   // }}
//                   name="candidate_id"
//                   onValueChange={handleCandidateChange}
//                 >
//                   <SelectTrigger className="fullwid">
//                     <SelectValue placeholder="Select candidate status" />
//                   </SelectTrigger>
//                   <SelectContent>
//                     {filteredStatus.length > 0 &&
//                       filteredStatus.map((statuz, key) => {
//                         return statuz.status.map((statusItem, index) => (
//                           <SelectItem key={key + '-' + index} value={String(statusItem?.id)}>
//                             {statusItem?.statusName}
//                           </SelectItem>
//                         ));
//                       })}
//                   </SelectContent>
//                 </Select>
//               </div>
//               <span className="error">{errors?.candidateStatus}</span>
//             </div>
//           </div>
//           <Button type="submit" className="w-full md:w-auto">
//             Submit
//           </Button>
//         </form>

//         <CustomizedSnackbars
//           open={snackbarState.open}
//           handleClose={handleSnackbarClose}
//           message={snackbarState.message}
//           severity={snackbarState.severity}
//         />
//       </div>
//     </>
//   );
// }
