// import {  useEffect, useState } from "react";
// import { useDispatch, useSelector } from "react-redux";
// import { RootState } from "../../store/reducers";
// import { candidateProfile, candidateProfileDetails } from "../../store/model/candidate.types";
// import { AppDispatch } from "../../store";
// import { fetchPositionDetails } from "../../store/action/position-details.action";
// import { fetchAllRounds } from "../../store/action/round.action";
// import { RoundDetails,CreateRound } from "../../store/model/round.types";
// import { useParams } from "react-router-dom";
// import { fetchAllRequirement } from "../../store/action/requirement-details.action";
// import { FetchAllCandidate, getCandidateById, UpdateCandidateInd } from "../../store/action/candidate.action";
// import { Label } from "../ui/label";
// import { useSnackbar } from "../../utils/snackbar-function";
// import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from "../ui/dialog";

// import CustomizedSnackbars from "../customized-snackbar";
// import {
//   Select,
//   SelectContent,
//   SelectItem,
//   SelectTrigger,
//   SelectValue,
// } from "../ui/select";
// import {   Status, StatusCategory } from "../../store/model";
// import { fetchStatus } from "../../store/action/status.action";
// import { Button } from "../ui/button";
// import { Input } from "../ui/input";
// import {  RequirementLoop } from "../../store/model/requirement-details.types";
// import { HttpStatusCode } from "../../constants";

// interface EmployeeDetailProps {
//   candidateId: string;
//   setCandDet: React.Dispatch<React.SetStateAction<boolean>>
// }

// interface InlineState{
//   candidate:candidateProfile,
//   newStatus : number;
//   oldStatus:number
// }
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
//   csalary: string;
//   esalary: string;
//   noticePeriod: string;
//   requirementId: number;
//   candidateStatus: number;
// }

// const EmployeeDetail: React.FC<EmployeeDetailProps> = () => {

//   //global state
//   const { rounds } = useSelector((state: RootState) => state?.roundsSelector) || {};
//   const { requirements } = useSelector((state: RootState) => state?.requirementsSelector) || {};
//   const { user } = useSelector((state:RootState)=> state?.authSelector);
//   // const { positions } = useSelector((state: RootState) => state?.positionDetailsSelector) || {};

//   // extracted from url
//   const { id } = useParams();

//   //local state
//   const [tab, setTab] = useState("tab1");
//   const [ cate , setCate] = useState<Status[]>([]);
//   const [ status, setStatus] = useState<Status[]>([]);

//   const handleTab = (tab: string) => {
//     setTab(tab);
//   };

//   const {
//     snackbarState,
//     showSuccessSnackbar,
//     showErrorSnackbar,
//     // showWarningSnackbar,
//     handleSnackbarClose,
//   } = useSnackbar();
//   const [isFormOpen, setIsFormOpen] = useState(false);
//   const [candidate, setCandidate] = useState<candidateProfileDetails | null>(null);
//   const [inlineEditing, setInlineEditing] = useState<InlineState>({
//     candidate: {} as candidateProfile,
//     newStatus : 0,
//     oldStatus: 0
//   });
//   const [candidatemain, setCandidateMain ] = useState<candidateProfileDetails>();
//   const [clients , setClients] = useState();
//   console.log(clients)
//   //dialog box 2
//   const [isFormOpen1, setIsFormOpen1] = useState(false);
//   const [inlineEditing1, setInlineEditing1] = useState({
//       source: '',
//       date: '',
//       candidateName: '',
//       phoneNo: '',
//       emailId: '',
//       currentLocation: '',
//       totalExp: '',
//       relExp: '',
//       skillSet: '',
//       csalary: '',
//       esalary: '',
//       noticePeriod: '',
//       requirementId: 0,
//       candidateStatus: 0,
//   });

//   //date function
//   const isoDateString = candidate?.createdAt ? candidate?.createdAt : new Date() ;
//   const date = new Date(isoDateString);
//   const formattedDate = date.toLocaleString('en-US', {
//     weekday: 'long',
//     year: 'numeric',
//     month: 'long',
//     day: 'numeric',
//     hour: '2-digit',
//     minute: '2-digit',
//     hour12: true,
//   });

//   const dispatch = useDispatch<AppDispatch>();
//   // filteration
//   const filterRoundOfCandidate = rounds.filter((round:CreateRound)=>round?.candidate?.id === candidate?.id)
//   const filteredReq = requirements.find((req : RequirementLoop) => req.id === candidate?.requirementDetails.id)

//   // Effect

//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//           await dispatch(fetchAllRounds());
//           await dispatch(fetchPositionDetails());
//           await dispatch(fetchAllRequirement());
//           await dispatch(FetchAllCandidate());
//          const statusDetail  = await dispatch(fetchStatus()).unwrap()

//          if(statusDetail.data){
//           setCate(statusDetail.data)
//           setStatus(statusDetail.data)

//          }
//         if(id ){
//          const response =  await  dispatch(getCandidateById({ id: parseInt(id) })).unwrap();
//           if(response.data){
//             setCandidate(response.data as candidateProfileDetails)
//           }
//         }
//       } catch (error) {
//         console.error('Failed to fetch following actions', error);
//       }
//     };
//     fetchData();
//   }, [dispatch]);

//   useEffect(()=>{
//     const filteredCli = requirements.find((req : RequirementLoop) => req.id === candidatemain?.requirementDetails.id)
//     setClients(filteredCli?.client)
//   },[candidatemain])

//   const handleSubmit = async (e: { preventDefault: () => void; }) =>{
//     e.preventDefault();
//     setIsFormOpen(false);

//   }
//   const handleSelect = (value:string) =>{
//     const result = status.filter((statue:StatusCategory)=> statue.id === parseInt(value) )
//     setCate(result)
//  }
//  const handleSelectStatus = (value : string) =>{
//   setInlineEditing({
//    ...inlineEditing,
//     newStatus: parseInt(value)
//   })
//  }

// const handleEditChange = (candidatez:candidateProfileDetails) =>{
//     setCandidateMain(candidatez)
//     setInlineEditing({
//       candidate: candidatez as unknown as candidateProfile,
//       oldStatus:candidatez.candidateStatus.id,
//       newStatus: 0
//     })
//  }
// const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
//   const { name, value } = e.target;

//   if (name === 'phoneNo' && value.length > 10) {
//     return;
//   } else {
//     setInlineEditing1({
//       ...inlineEditing1,
//       [name]: value,
//     });
//   }

// };

// const handleSelectChange = (value: string) => {
//     setInlineEditing1({
//       ...inlineEditing1,
//       requirementId : parseInt(value)
//     })
// };

// const handleFormOpen = (candidatez:candidateProfileDetails) =>{
//   if(candidatez){
//   const date = new Date(candidatez.date);
//   const formattedDates = `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`;

//     setIsFormOpen1(true)
//     setInlineEditing1({
//       source:candidatez.source ,
//       date:formattedDates,
//       candidateName: candidatez.candidateName,
//       phoneNo: candidatez.primaryContact,
//       emailId: candidatez.emailId,
//       currentLocation: candidatez.candidateLocation,
//       totalExp: candidatez.totalExp,
//       relExp: candidatez.relExp,
//       skillSet: candidatez.skillSet,
//       currentSalary : candidatez.currentSalary,
//       expectedSalary: candidatez.expectedSalary,
//       noticePeriod: candidatez.noticePeriod,
//       requirementId: candidatez.requirementDetails.id,
//       candidateStatus: candidatez.candidateStatus.id,
//     });

//   }
// }

// const handleUpdateCandSubmit = async  (e: { preventDefault: () => void; }) =>{
//   e.preventDefault()
//   setIsFormOpen1(false)
//   if(inlineEditing1){
//       try{
//         if(id){
//           const response = await dispatch(UpdateCandidateInd({
//             id:parseInt(id),
//             payload:{
//               source:inlineEditing1.source ,
//               date:inlineEditing1.date,
//               candidateName: inlineEditing1.candidateName,
//               primaryContact: inlineEditing1.phoneNo,
//               emailId: inlineEditing1.emailId,
//               candidateLocation: inlineEditing1.currentLocation,
//               totalExp: inlineEditing1.totalExp,
//               relExp: inlineEditing1.relExp,
//               skillSet: inlineEditing1.skillSet,
//               currentSalary:inlineEditing1.cu
//               requirementDetails: {
//                   id:inlineEditing1.requirementId
//               },
//               candidateStatus: {
//                   id:inlineEditing1.candidateStatus
//               },
//               updatedBy: {
//                 id:user?.id
//               },
//             }
//           })).unwrap();
//           if(response?.statusCode ===  HttpStatusCode.OK){
//              await showSuccessSnackbar(response.message ?? 'Candidate details has been successfully updated')
//              setCandidate(response.data as unknown as candidateProfileDetails)
//           }
//           else{
//             await showErrorSnackbar(response.message ?? 'Candidate details has not been updated')

//           }

//         }

//       }
//       catch(error){

//       }
//   }
// }

//   return (
//     <div className="employeeDetail">
//       <div className="employeeDetail1">
//         <h4>Candidate Profile</h4>
//       </div>
//       <div className="employeeDetail2">
//         <div className="employeeDetail21">
//           <div className="emptabs">
//             <ul>
//               <li className={tab === "tab1" ? "active" : ""}>
//                 <a href="#" onClick={(e) => {  e.preventDefault() ; handleTab("tab1")}}>
//                   profile
//                 </a>
//               </li>
//               <li className={tab === "tab2" ? "active" : ""}>
//                 <a href="#" onClick={(e) => {  e.preventDefault(); handleTab("tab2")}}>
//                   contract
//                 </a>
//               </li>
//               <li className={tab === "tab3" ? "active" : ""}>
//                 <a href="#" onClick={(e) =>{ e.preventDefault();   handleTab("tab3")}}>
//                   Round Details
//                 </a>
//               </li>

//             </ul>
//           </div>
//         </div>
//         <div className="employeeDetail22">
//           {/* profile */}
//           <div className="empdetmain">
//             <div className="empdethed">
//               <div className="emphedlet">
//                 <div className="emphimg">
//                   <img
//                     src="/src/assets/img.jpg"
//                   />
//                 </div>
//                 <div className="emphinfo">
//                   <h4>{candidate?.candidateName ?? ''}</h4>
//                   <span>{filteredReq?.positionDetails.positionName ?? ''}</span>
//                 </div>
//               </div>
//               <div className="emphedrit">
//              {
//               // (user.id === candidate?.createdBy.id || user.role.id === 1)&&
//               <button onClick={() => { if(candidate){handleFormOpen(candidate)}; } } > Edit</button>
//               }
//               </div>
//             </div>
//             {tab === "tab1" && (
//               <>
//                 <div className="empdetbody">
//                   <div className="empdetbinfo">
//                     <div className="empdetbhed">
//                       <h4>General Information</h4>
//                       {/* <Button className="btnhok1">Edit</Button> */}
//                     </div>
//                     <div className="empdetbbody">
//                       <div className="profcard">
//                         <span>Application Date</span>
//                         <h4>{formattedDate ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Role</span>
//                         <h4>{filteredReq?.positionDetails.positionName ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Email ID</span>
//                         <h4>{candidate?.emailId ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Phone number</span>
//                         <h4>{candidate?.primaryContact ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Source</span>
//                         <h4>{candidate?.source ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Location</span>
//                         <h4>{candidate?.candidateLocation ?? ''}</h4>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
//             {tab === "tab2" && (
//               <>
//                 <div className="empdetbody">
//                   <div className="empdetbinfo">
//                     <div className="empdetbhed">
//                       <h4>Contract Information</h4>
//                       {/* <Button className="btnhok1">Edit</Button> */}
//                     </div>
//                     <div className="empdetbbody">
//                       <div className="profcard">
//                         <span>Contract type</span>
//                         <h4>Fixed term</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Period</span>
//                         <h4>2 years</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Start date</span>
//                         <h4>4th july 2024</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Company</span>
//                         <h4>{filteredReq?.client?.clientName ?? ''}</h4>
//                       </div>
//                       <div className="profcard">
//                         <span>Attachment</span>
//                         <h4>
//                           <a href="#" >{candidate?.candidateName ?? ''}'s resume</a>
//                         </h4>
//                       </div>
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
//              {tab === "tab3" && (
//               <>
//                 <div className="empdetbody">
//                   <div className="empdetbinfo">
//                     <div className="empdetbhed">
//                       <h4>Candidate Status</h4>
//                     </div>
//                     <div className="empdetbbody  records">
//                       <div className="profcard flx spce-bet">
//                         <div className="candiv">
//                           <span>Status</span>
//                           <h4>{candidate?.candidateStatus?.statusName ?? ''}</h4>
//                           </div>
//                         <div className="emphedrit">
//                             <button  onClick={() =>{ if (candidate) { setIsFormOpen(true); handleEditChange(candidate); } }}>Edit</button>
//                         </div>

//                       </div>
//                       {

//                         filterRoundOfCandidate.map((records:RoundDetails) =>{
//                            return   <div className="profcard">
//                                   <span>{records.roundName}</span>
//                                   <p>{records.feedBack ?? 'Not yet updated'} </p>
//                                   <div className={`pcardstatus ${ records.complete ? 'success' : 'failed'}`}>
//                                   <span>
//                                     {records.complete ? 'Cleared' : 'Pending'}
//                                   </span>
//                                   </div>
//                               </div>
//                         })
//                       }
//                       {/* <div className="profcard">
//                           <span>Aptitude Round</span>
//                           <p>The client communication was not good enoughments</p>
//                           <div className="pcardstatus success">
//                               <span>Cleared</span>
//                           </div>
//                       </div> */}
//                     </div>
//                   </div>
//                 </div>
//               </>
//             )}
//           </div>
//           <div className="empdetfoot"></div>
//         </div>
//       </div>

//       <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
//                 <DialogContent  className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[500px]">

//                   <div className="flex items-center space-x-2">
//                   <div className="clientmain  pb-1">
//                       <h2 className="scroll-m-20 mb-10 border-b pb-2 text-3xl font-semibold tracking-tight first:mt-0">
//                         Candidate status update
//                       </h2>
//                       <form onSubmit={handleSubmit} className="space-y-6">
//                         <div className="grid vw-100 sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-1 gap-2">
//                           <div className="space-y-2">
//                             <Label htmlFor="clientName">Category</Label>
//                                 <div
//                                 id="location_id"
//                               >
//                                 <Select
//                                   name="location_id"
//                                   onValueChange={handleSelect}

//                                 >
//                                   <SelectTrigger className="fullwid">
//                                     <SelectValue placeholder="Please select the location" />
//                                   </SelectTrigger>
//                                   <SelectContent>
//                                   {status && status.map((statue: StatusCategory) => {
//                                       return (
//                                         <SelectItem
//                                           key={statue.id}
//                                           value={String(statue.id)}
//                                         >
//                                           {statue.categoryName}
//                                         </SelectItem>
//                                       );
//                                     })
//                                     }
//                                   </SelectContent>
//                                 </Select>
//                               </div>
//                           </div>
//                           <div className={`space-y-2 mt-2 `} >
//                             <Label htmlFor="clientName">Status</Label>
//                                 <div
//                                 id="status_id"
//                               >
//                                 <Select
//                                   name="status_id"
//                                   onValueChange={handleSelectStatus}
//                                 >
//                                   <SelectTrigger className="fullwid">
//                                     <SelectValue placeholder="Please select the status" />
//                                   </SelectTrigger>
//                                   <SelectContent>
//                                     {cate.length > 0 &&
//                                       cate.map((statuz) => {
//                                         return statuz.status.map((statusItem) => (
//                                           <SelectItem
//                                           key={statusItem.id}
//                                           value={String(statusItem.id)}
//                                         >
//                                           {statusItem.statusName}
//                                         </SelectItem>
//                                         ));
//                                       })
//                                     }

//                                   </SelectContent>
//                                 </Select>
//                               </div>
//                           </div>

//                         </div>
//                         <div className="btnamain space-y-2">
//                           <button className="buttonfill" type="submit" onClick={handleSubmit}>
//                             <div className="wrap">
//                               <p>Submit</p>
//                             </div>
//                           </button>

//                         </div>
//                       </form>
//                     </div>
//                   </div>

//                 </DialogContent>
//       </Dialog>

//       <Dialog open={isFormOpen1} onOpenChange={setIsFormOpen1}>
//         <DialogContent className="sm:max-w-[600px] md:max-w-[700px] lg:max-w-[1100px]">
//           <DialogHeader>
//             <DialogTitle className="text-2xl font-bold">Candidate Profile</DialogTitle>
//           </DialogHeader>
//           <form className="space-y-6 flexform">
//             <div className="grid sm:grid-cols-2 md:grid-cols-4 lg:grid-cols-4 gap-6">
//               <div className="space-y-2">
//                 <Label htmlFor="source">Source</Label>
//                 <Input
//                   id="source"
//                   name="source"
//                   type="text"
//                   placeholder="Enter the source"
//                   value={inlineEditing1.source}
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="date">Date</Label>
//                 <Input
//                   id="date"
//                   name="date"
//                   type="date"
//                   placeholder="Enter the date"
//                   value={inlineEditing1.date}
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />

//                 {/* <Popover>
//                       <PopoverTrigger asChild>
//                         <Button
//                           variant={"outline"}
//                           className={cn("w-[240px] justify-start text-left font-normal", !selectedDate && "text-muted-foreground")}
//                         >
//                           <CalendarIcon />
//                           {selectedDate ? format(selectedDate, "PPP") : <span>Pick a date</span>}
//                         </Button>
//                       </PopoverTrigger>
//                       <PopoverContent className="w-auto p-0" align="start">
//                         <Calendar mode="single" selected={selectedDate}  onSelect={(value: Date | undefined) => {
//                           console.log("Selected date:", value);
//                           handleSelectDate(value);
//                         }}initialFocus />
//                       </PopoverContent>
//                     </Popover> */}
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="candidateName">Candidate Name</Label>
//                 <Input
//                   id="candidateName"
//                   name="candidateName"
//                   value={inlineEditing1.candidateName}
//                   type="text"
//                   placeholder="Enter your name"
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="phoneNo">Phone No</Label>
//                 <Input
//                   id="phoneNo"
//                   name="phoneNo"
//                   type="number"
//                   value={inlineEditing1.phoneNo}
//                   placeholder="Enter your number"
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="emailId">Email ID</Label>
//                 <Input
//                   id="emailId"
//                   name="emailId"
//                   type="email"
//                   value={inlineEditing1.emailId}
//                   placeholder="Enter your email"
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="currentLocation">Current Location</Label>

//                 <Input
//                   id="currentLocation"
//                   name="currentLocation"
//                   type="text"
//                   placeholder="Enter your current location"
//                   value={inlineEditing1.currentLocation}
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="totalExp">Total Exp</Label>
//                 <Input
//                   id="totalExp"
//                   name="totalExp"
//                   placeholder="Enter your total experience"
//                   value={inlineEditing1.totalExp}
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="relExp">Rel Exp</Label>
//                 <Input
//                   id="relExp"
//                   name="relExp"
//                   value={inlineEditing1.relExp}
//                   placeholder='Enter your related experience'
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="skillSet">Skill Set</Label>
//                 <Input
//                   id="skillSet"
//                   name="skillSet"
//                   type="text"
//                   placeholder="Enter your related experience"
//                   value={inlineEditing1.skillSet}
//                   onChange={(e)=>{
//                     handleChange(e);
//                   }}
//                 />
//               </div>
//               <div className="space-y-2">
//                 <Label htmlFor="requirement_id">Requirement ID</Label>

//                 <div id="requirement_id" >
//                   <Select name="requirement_id" value={String(inlineEditing1.requirementId)}  onValueChange={handleSelectChange}>
//                     <SelectTrigger className="fullwid">
//                       <SelectValue placeholder="Select Requirement details" />
//                     </SelectTrigger>
//                     <SelectContent>
//                       {requirements &&
//                         requirements.map((requirement: RequirementLoop) => {
//                         //  if(requirements.isActive){
//                           return (
//                             <SelectItem key={requirement.id}
//                             value={String(requirement.id)}>
//                               {requirement?.client?.clientName +
//                                 ' - ' +
//                                 requirement?.positionDetails?.positionName + " - "
//                                 +
//                                 requirement?.relExp + ' yrs'
//                                 }
//                             </SelectItem>
//                           );
//                         //  }
//                         })}
//                     </SelectContent>
//                   </Select>
//                 </div>
//               </div>

//             </div>
//             <DialogFooter>
//               <Button type="submit" onClick={handleUpdateCandSubmit}  className="w-full md:w-auto">
//                 Submit
//               </Button>
//             </DialogFooter>
//           </form>
//         </DialogContent>
//       </Dialog>

//       <CustomizedSnackbars
//         open={snackbarState.open}
//         handleClose={handleSnackbarClose}
//         message={snackbarState.message}
//         severity={snackbarState.severity}
//       />

//     </div>
//   );
// };

// export default EmployeeDetail;
