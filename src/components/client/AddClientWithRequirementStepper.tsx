import React, { useEffect, useState } from 'react';
import { useDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import { createClient, parseClient, FetchAllClients } from '../../store/action/client.action';
import {
  createRequirementDetail,
  fetchAllRequirement,
  parseJD,
} from '../../store/action/requirement-details.action';
import { fetchPositionDetails } from '../../store/action/position-details.action';
import { HttpStatusCode } from '../../constants';
import { CreateClient, client } from '../../store/model/client.types';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import StepperHeader from './StepperHeader';
import ResumePreview from '../resume-parser/ResumePreview';
import AddClientForm from './addClientForm';
import {
  AddClientFormData,
  AddClientFormErrors,
  EMPTY_CLIENT_ERRORS,
} from "./addClientForm.types";
import RequirementForm from './RequirementForm';
import {
  RequirementFormData,
  RequirementFormErrors,EMPTY_REQUIREMENT_ERRORS
} from './requirementForm.types';
import ProcessingOverlay from '../resume-parser/ProcessingOverlay';
import { PIPELINE_STAGES } from '../resume-parser/constants';
import type { ProcessingStage } from '../resume-parser/types';
import type { Option } from './addClientForm.types';
import { fetchRequirementStatuses } from '../../store/action/requirement-details.action';
import store from '../../store';
import { fetchClientLocations } from '../../store/action/client-location.action';
import { useScrollToError } from '../../hooks/useScrollToError';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '../../components/ui/alert-dialog';
interface Props {
  isOpen: boolean;
  onClose: () => void;
}

/** Match JRF client name to an existing profile (case-insensitive, trimmed). */
function normalizeClientNameKey(name: string | undefined | null): string {
  return (name ?? '').trim().toLowerCase().replace(/\s+/g, ' ');
}

type ClientListRow = {
  id?: number;
  clientName?: string;
  emailId?: string;
  email_id?: string;
  spocName?: string;
  spocContactNumber?: string;
  phone_number?: string;
  locations?: string[];
};

function findClientByParsedName(
  parsedName: string | undefined,
  list: ClientListRow[] | undefined,
): ClientListRow | undefined {
  const key = normalizeClientNameKey(parsedName);
  if (!key) return undefined;
  return (list ?? []).find((c) => normalizeClientNameKey(c.clientName) === key);
}

function existingClientToFormData(row: ClientListRow) {
  return {
    clientName: row.clientName ?? '',
    emailId: row.emailId ?? row.email_id ?? '',
    spocName: row.spocName ?? '',
    spocContactNumber: row.spocContactNumber ?? row.phone_number ?? '',
    locations: Array.isArray(row.locations) ? [...row.locations] : [],
  };
}
const AddClientWithRequirementStepper: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { user } = useAppSelector((s: RootState) => s.authSelector) || {};
  const { clients } = useAppSelector((s: RootState) => s.clientsSelector) || { clients: [] };
  const [fallbackParsed, setFallbackParsed] = useState(false);
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();
  // ── Stepper ────────────────────────────────────────────────────────────────
  // const [step, setStep] = useState<1 | 2 | 3>(1);
  const [step, setStep] = useState(0);
  // ── Shared upload state ────────────────────────────────────────────────────
  const [file, setFile] = useState<File | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  // ── Step 2 — Client form ───────────────────────────────────────────────────
  const [clientForm, setClientForm] = useState<AddClientFormData>({
    clientName: '',
    emailId: '',
    spocName: '',
    spocContactNumber: '',
    locations: [],
  });
  const [clientErrors, setClientErrors] = useState<AddClientFormErrors>({ ...EMPTY_CLIENT_ERRORS });
  // ── Step 3 — Requirement form ──────────────────────────────────────────────
  const [reqForm, setReqForm] = useState<RequirementFormData>({
    noOfPositions: '',
    skill: [],
    experience: '',
    client_id: '',
    position_detail_id: '',
    position: '',
    startDate: '',
    endDate: '',
    status: '',
    remarks: '',
    salaryBudget: '',
    roleType: '',
    modeOfWork: '',
    modeOfInterview: '',
    accountManager: '',
    approvedBy: '',
    reportingManager: '',
    priority: '',
    jobRequirementForm: '',
    positionType: '',
  });
  const [reqErrors, setReqErrors] = useState<RequirementFormErrors>({
    ...EMPTY_REQUIREMENT_ERRORS,
  });
  const { statuses: requirementStatuses } = useAppSelector(
  (s: RootState) => s.requirementsSelector
);
  const [submitting, setSubmitting] = useState(false);
  const { registerField, scrollContainerRef, scrollToError } = useScrollToError();
  const [jrfS3Key, setJrfS3Key] = useState<string | null>(null);
  const [jrfSkipped, setJrfSkipped] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [stage, setStage] = useState<ProcessingStage>('');
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());
  const [transitioning, setTransitioning] = useState(false);
  const runStages = async () => {
    for (const s of PIPELINE_STAGES) {
      setStage(s.id);
      await new Promise<void>((r) => setTimeout(r, 650));
    }
  };
  useEffect(() => {
    if (isOpen) {
      setStep(1);
      setFile(null);
      setPdfUrl('');
      setClientForm({
        clientName: '',
        emailId: '',
        spocName: '',
        spocContactNumber: '',
        locations: [],
      });
      setClientErrors({ ...EMPTY_CLIENT_ERRORS });
      setReqForm({
        noOfPositions: '',
        skill: [],
        experience: '',
        client_id: '',
        position_detail_id: '',
        position: '',
        startDate: '',
        endDate: '',
        status: '',
        remarks: '',
        salaryBudget: '',
        roleType: '',
        modeOfWork: '',
        modeOfInterview: '',
        accountManager: '',
        approvedBy: '',
        reportingManager: '',
        priority: '',
        jobRequirementForm: '',
        positionType: '',
      });
      setReqErrors({ ...EMPTY_REQUIREMENT_ERRORS });
      setSubmitting(false);
      setJrfSkipped(false);
      setCompletedSteps(new Set());
      setTransitioning(false);  
    }
  }, [isOpen]);
  const clientsLen = Array.isArray(clients) ? clients.length : 0;

  useEffect(() => {
    if (!isOpen) return;
    dispatch(fetchPositionDetails());
    dispatch(fetchRequirementStatuses());
    if (clientsLen === 0) {
      dispatch(FetchAllClients());
    }
  }, [dispatch, isOpen, clientsLen]);

  // ── Requirement dropdown options (one row per client profile) ─────────────
  const clientOptions: Option[] = (clients ?? []).map((c: client) => ({
    value: String(c.id),
    label: c.clientName,
  }));

  const handleFileChange = async (f: File | null) => {
  setFile(f);
  setPdfUrl('');
  if (!f) return;

  setProcessing(true);
  setStage('');
  const stagesDone = runStages();

  try {
    if (f.type === 'application/pdf') {
      setPdfUrl(URL.createObjectURL(f));
    }

    const [clientRes, jdRes] = await Promise.all([
      dispatch(parseClient(f)).unwrap(),
      dispatch(parseJD(f)).unwrap(),
    ]);

    setJrfS3Key(
      typeof jdRes?.jrfS3Key === 'string' && jdRes.jrfS3Key ? jdRes.jrfS3Key : null,
    );

    await stagesDone;

    let profileRows: ClientListRow[] = [];
    try {
      const listRes = (await dispatch(FetchAllClients()).unwrap()) as {
        data?: ClientListRow[];
      };
      profileRows = Array.isArray(listRes?.data) ? listRes.data : [];
    } catch {
      profileRows = store.getState().clientsSelector?.clients ?? [];
    }

    const existing = findClientByParsedName(clientRes.clientName, profileRows);

    if (existing) {
      // Existing client found — fully overwrite client form with DB data
      setClientForm(existingClientToFormData(existing));
    } else {
      // New client — merge JRF data: JRF value takes priority over what user typed
      setClientForm((prev) => ({
        clientName:          clientRes.clientName      || prev.clientName,
        emailId:             clientRes.email           || prev.emailId,
        spocName:            clientRes.spocName        || prev.spocName,
        spocContactNumber:   clientRes.phone           || prev.spocContactNumber,
        locations: clientRes.city
          ? clientRes.city.split(',').map((c: string) => c.trim()).filter(Boolean)
          : prev.locations,   // keep existing locations if JRF has none
      }));
    }

    // Merge requirement data — JRF value takes priority
    setReqForm((prev) => ({
      ...prev,
      position:          jdRes.role              || prev.position,
      noOfPositions:     jdRes.positions?.toString() || prev.noOfPositions,
      skill:             jdRes.skills?.length    ? jdRes.skills    : prev.skill,
      experience:        jdRes.experience        || prev.experience,
      salaryBudget:      jdRes.salaryBudget      || prev.salaryBudget,
      approvedBy:        jdRes.approvedBy        || prev.approvedBy,
      accountManager:    jdRes.accountManager    || prev.accountManager,
      reportingManager:  jdRes.reportingManager  || prev.reportingManager,
      roleType:          jdRes.roleType          || prev.roleType,
      modeOfWork:        jdRes.modeOfWork?.toUpperCase() || prev.modeOfWork,
      modeOfInterview:   jdRes.modeOfInterview   || prev.modeOfInterview,
      startDate:         jdRes.requirementStartDate || prev.startDate,
      jobRequirementForm: jdRes.jobRequirementForm === 'Yes'
        ? 'true'
        : jdRes.jobRequirementForm === 'No'
          ? 'false'
          : prev.jobRequirementForm,
      positionType:      jdRes.positionType      || prev.positionType,
    }));
    if (jdRes?.parsedBy === 'fallback') setFallbackParsed(true); 
    setJrfSkipped(false); // user uploaded a file, so not skipped anymore
    goToStep(2);

  } catch (err) {
    await stagesDone;
    goToStep(2);
  } finally {
    setProcessing(false);
    setStage('');
  }
};
  const goToStep = (nextStep: number) => {
    setTransitioning(true);
    setTimeout(() => {
        setStep(nextStep);
        setTransitioning(false);
    }, 200); // matches CSS transition duration
  };
  const handleSkipJrf = () => {
      setJrfSkipped(true);
      setFile(null);
      setPdfUrl('');
      goToStep(2);
    };

      // ── Step 2 → Step 3: validate client fields only (no API call yet) ─────────
  const validateClient = (): boolean => {
    const e: AddClientFormErrors = { ...EMPTY_CLIENT_ERRORS };
    let valid = true;
    if (!clientForm.clientName.trim()) {
      e.clientName = 'Client name is required';
      valid = false;
    }
    if (!clientForm.spocName.trim()) {
      e.spocName = 'SPOC name is required';
      valid = false;
    }
    if (clientForm.locations.length === 0) {
      e.locations = 'Add at least one location';
      valid = false;
    }
    setClientErrors(e);
    return valid;
  };

const handleStepperClick = (stepIndex: 0 | 1 | 2) => {
  const targetStep = stepIndex + 1; // stepIndex 0=step1, 1=step2, 2=step3

  // ── Going BACK (any step) ──────────────────────────────────────────────
  if (targetStep < step) {
    if (targetStep === 1) {
      // Going back to Step 1 — reset everything like handleClearFile
      setFile(null);
      setPdfUrl('');
      setJrfSkipped(false);
    }
    goToStep(targetStep);
    return;
  }

  // ── Going FORWARD ─────────────────────────────────────────────────────
  // Step 1 → Step 2 (skip JRF)
  if (step === 1 && stepIndex === 1) {
    handleSkipJrf();
    return;
  }
   // Step 1 → Step 3 directly (only if Step 2 was already completed & valid)
  if (step === 1 && stepIndex === 2) {
    if (completedSteps.has(1) && validateClient()) {
      // Step 2 data exists and is valid → allow jump to Step 3
      goToStep(3);
    } else {
      // Step 2 not completed → go to Step 2 first
      handleSkipJrf();
    }
    return;
  }
  // Step 2 → Step 3 (validate first)
  if (step === 2 && stepIndex === 2) {
    const isValid = validateClient();
    if (!isValid) return;
    setCompletedSteps(prev => new Set(prev).add(1));
    goToStep(3);
    return;
  }
};

  // ── Client form field changes ──────────────────────────────────────────────
  const handleClientChange = (key: keyof AddClientFormData, val: string | string[]) => {
    setClientForm((p) => ({ ...p, [key]: val }));
    setClientErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleClientClear = () => {
    setClientForm({
      clientName: '',
      emailId: '',
      spocName: '',
      spocContactNumber: '',
      locations: [],
    });
    setClientErrors({ ...EMPTY_CLIENT_ERRORS });
  };


const handleClientNext = () => {
    const isValid = validateClient();  // always call, sets errors in state
    if (!isValid) return;
    setCompletedSteps(prev => new Set(prev).add(1));
    goToStep(3);
};
  // ── Requirement form field changes ─────────────────────────────────────────
  const handleReqChange = (key: keyof RequirementFormData, val: string | string[]) => {
    setReqForm((p) => ({ ...p, [key]: val }));
    setReqErrors((p) => ({ ...p, [key]: '' }));
  };

  const handleReqClear = () => {
    setReqForm({
      noOfPositions: '',
      skill: [],
      experience: '',
      client_id: '',
      position_detail_id: '',
      position: '',
      startDate: '',
      endDate: '',
      status: '',
      remarks: '',
      salaryBudget: '',
      roleType: '',
      modeOfWork: '',
      modeOfInterview: '',
      accountManager: '',
      approvedBy: '',
      reportingManager: '',
      priority: '',
      jobRequirementForm: '',
      positionType: '',
    });
    setReqErrors({ ...EMPTY_REQUIREMENT_ERRORS });
  };

  // ── Step 3 validation ──────────────────────────────────────────────────────
  const validateRequirement = (): boolean => {
    const e: RequirementFormErrors = { ...EMPTY_REQUIREMENT_ERRORS };
    let valid = true;
    if (!reqForm.noOfPositions.trim()) {
      e.noOfPositions = 'No. of positions is required';
      valid = false;
    }
    if (!reqForm.position.trim()) {
      e.position = 'Position is required';
      valid = false;
    }
    if (!reqForm.experience.trim()) {
      e.experience = 'Experience is required';
      valid = false;
    } else if (/[a-zA-Z]/.test(reqForm.experience)) {
      e.experience = 'Experience must not contain letters';
      valid = false;
    }
    if (reqForm.skill.length === 0) {
      e.skill = 'At least one skill is required';
      valid = false;
    }
    if(!reqForm.status.trim()){
      e.status = 'Status is required';
      valid = false;
    }
    setReqErrors(e);
    scrollToError(e);
    return valid;
  };
  const handleClearFile = () => {
    setFile(null);
    setPdfUrl('');
    setStep(1);
    setClientForm({
      clientName: '',
      emailId: '',
      spocName: '',
      spocContactNumber: '',
      locations: [],
    });
    setClientErrors({ ...EMPTY_CLIENT_ERRORS });
    setReqForm({
       noOfPositions: '',
        skill: [],
        experience: '',
        client_id: '',
        position_detail_id: '',
        position: '',
        startDate: '',
        endDate: '',
        status: '',
        remarks: '',
        salaryBudget: '',
        roleType: '',
        modeOfWork: '',
        modeOfInterview: '',
        accountManager: '',
        approvedBy: '',
        reportingManager: '',
        priority: '',
        jobRequirementForm: '',
        positionType: '',
    });
    setReqErrors({ ...EMPTY_REQUIREMENT_ERRORS });
  };
  // ── Final submit: createClient → createRequirement ─────────────────────────
  const handleFinalSubmit = async () => {
    if (!validateRequirement()) return;
    setSubmitting(true);
    try {
      const clientPayload: CreateClient = {
        clientName: clientForm.clientName,
        locations: clientForm.locations,
        emailId: clientForm.emailId,
        spocName: clientForm.spocName,
        spocContactNumber: clientForm.spocContactNumber,
        createdBy: { id: user?.id },
      };

      const clientRes = await dispatch(createClient(clientPayload)).unwrap();
      if (
        clientRes?.statusCode !== HttpStatusCode.CREATED &&
        clientRes?.statusCode !== HttpStatusCode.OK
      ) {
        showErrorSnackbar(clientRes?.message || 'Failed to create client');
        return;
      }
      const newClientId = clientRes?.data?.id;
      const reqPayload: Record<string, unknown> = {
        client:          { id: newClientId ?? Number(reqForm.client_id) },
        noOfPosition:    Number(reqForm.noOfPositions),
        skillSet:        [...reqForm.skill],
        relExp: reqForm.experience || undefined,
        isActive:        true,
        position: reqForm.position || '',
        openDate: reqForm.startDate || undefined,
        closeDate: reqForm.endDate   || undefined,
        remarks: reqForm.remarks   || undefined,
        statusId:  reqForm.status    ? Number(reqForm.status) : undefined,
        createdBy:       { id: user?.id },
        salaryBudget:    reqForm.salaryBudget || undefined,
        roleType:        reqForm.roleType || undefined,
        modeOfWork:      reqForm.modeOfWork || undefined,
        modeOfInterview: reqForm.modeOfInterview || undefined,
        accountManager:  reqForm.accountManager || undefined,
        approvedBy:      reqForm.approvedBy || undefined,
        reportingManager:reqForm.reportingManager || undefined,
        jobRequirementForm: reqForm.jobRequirementForm === 'true',
        priority:     reqForm.priority || undefined,
        positionType: reqForm.positionType || undefined,
      };
      if (jrfS3Key) reqPayload.jrfS3Key = jrfS3Key;

      const reqRes: any = await dispatch(createRequirementDetail(reqPayload as any)).unwrap();
      if (reqRes?.message?.toLowerCase().includes('already exists') || reqRes?.success === false) {
        showErrorSnackbar('This requirement already exists.');
        return;
      }
      //Refresh both lists
      await Promise.all([dispatch(FetchAllClients()), dispatch(fetchAllRequirement()),dispatch(fetchClientLocations())]);
      showSuccessSnackbar('Client and requirement added successfully');
      setTimeout(() => onClose(), 900);
    } catch (err) {
      showErrorSnackbar('Failed to submit. Please try again.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop */}
      //<div className="fixed inset-0 z-40 bg-black/60" onClick={onClose} />
      {/* Modal shell — only here, removed from individual forms */}
      <div className="fixed inset-0 z-50 flex items-center justify-center">
        <div
          className="bg-white rounded-2xl shadow-2xl w-full max-w-[5xl] h-[90vh]
          flex flex-col overflow-hidden relative">
          {processing && (
            <div className="absolute inset-0 z-[100] flex items-center justify-center bg-white/70 backdrop-blur-sm rounded-2xl">
              <ProcessingOverlay stage={stage} />
            </div>
          )}
          <AlertDialog open={fallbackParsed}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span>⚠️</span> AI Parser Unavailable
            </AlertDialogTitle>
            <AlertDialogDescription>
              JRF parsed using basic parser due to high AI server load. Please verify the details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setFallbackParsed(false);
                handleClearFile();   // clears form, goes back to step 1
              }}
            >
              Re-upload
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setFallbackParsed(false)}
            >
              Review Details
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
          {/* ── Stepper header (title + close + step indicator) ── */}
          <StepperHeader currentStep={(step - 1) as 0 | 1 | 2}  onClose={onClose} onStepClick={handleStepperClick} completedSteps={completedSteps} />
          {/* ── Step 1: Upload JD ── */}
          {/* ── Transition wrapper for all steps ── */}
          <div
            style={{
              opacity: transitioning ? 0 : 1,
              transform: transitioning ? 'translateY(6px)' : 'translateY(0)',
              transition: 'opacity 0.2s ease, transform 0.2s ease',
              flex: 1,
              minHeight: 0,
              display: 'flex',
              flexDirection: 'column',
              overflow: 'hidden',
            }}
          >
            {/* ── Step 1: Upload JD ── */}
            {step === 1 && (
              <main className="flex flex-1 items-center justify-center p-5 min-h-0 overflow-hidden">
                <div className="w-full max-w-6xl h-full flex flex-col">
                  <div className="flex-1 min-h-0">
                    <UploadPanel
                      file={file}
                      pdfUrl={pdfUrl}
                      onFileChange={handleFileChange}
                      onClear={handleClearFile}
                      showError={showErrorSnackbar}
                    />
                  </div>
                  {/* Skip link */}
                  <div className="flex justify-center py-3 flex-shrink-0">
                    <button
                      onClick={handleSkipJrf}
                      className="text-sm text-gray-500 hover:text-[#0F2A44] underline underline-offset-2 transition-colors"
                    >
                      Skip & Enter Manually →
                    </button>
                  </div>
                </div>
              </main>
            )}

            {/* ── Step 2: Client Details ── */}
            {step === 2 && (
              <AddClientForm
                form={clientForm}
                errors={clientErrors}
                submitting={false}
                file={file}
                pdfUrl={pdfUrl}
                onChange={handleClientChange}
                onFileChange={handleClearFile}
                onNext={handleClientNext}
                onClear={handleClientClear}
                jrfSkipped={jrfSkipped}
              />
            )}

            {/* ── Step 3: Requirements ── */}
            {step === 3 && (
              <RequirementForm
                form={reqForm}
                errors={reqErrors}
                submitting={submitting}
                file={file}
                pdfUrl={pdfUrl}
                clientOptions={clientOptions}
                selectedClientName={
                  clientForm.clientName ||
                  clientOptions.find((c) => c.value === reqForm.client_id)?.label ||
                  ''
                }
                selectedLocations={clientForm.locations}
                onChange={handleReqChange}
                onFileChange={handleClearFile}
                onSubmit={handleFinalSubmit}
                onBack={() => setStep(2)}
                onClear={handleReqClear}
                statusOptions={requirementStatuses}
                registerField={registerField}
                scrollContainerRef={scrollContainerRef}
                jrfSkipped={jrfSkipped}
              />
            )}
          </div>  {/* ── end transition wrapper ── */}      
        </div>
      </div>
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
};

interface UploadPanelProps {
  file: File | null;
  pdfUrl: string;
  onFileChange: (f: File | null) => void;
  onClear: () => void;
  showError: (msg: string) => void;
}
const UploadPanel: React.FC<UploadPanelProps> = ({ file, pdfUrl, onFileChange, showError }) => {
  const [processing, setProcessing] = useState(false);

  const handleFile = async (f: File | null) => {
    if (!f) {
      onFileChange(null);
      return;
    }
    setProcessing(true);
    try {
      await onFileChange(f); 
    } finally {
      setProcessing(false);
    }
  };

  return (
    <ResumePreview
      file={file}
      previewUrl={pdfUrl}
      error=""
      parsed={false}
      processing={processing}
      onFile={handleFile}
      showError={showError}
      //onClear={() => onFileChange(null)}
      onClear={() => onFileChange(null)}
      title="Upload JD"
      infoDots={[
        'Client Name',
        'SPOC Details',
        'Email',
        'Phone',
        'Location',
        'Skills',
        'Experience',
      ]}
    />
  );
};
export default AddClientWithRequirementStepper;
