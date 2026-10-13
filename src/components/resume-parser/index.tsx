import React, { useState } from "react";
import { EMPTY_FORM, PIPELINE_STAGES } from "./constants";
import type { ParsedResume, ProcessingStage } from "./types";
import CandidateFormContainer from "./candidate/CandidateFormContainer";
import ResumePreview          from "./ResumePreview";
import ProcessingOverlay      from "./ProcessingOverlay";
import { useDispatch }        from "../../store";
import { uploadResume }       from "../../store/action/candidate.action";
import { useSnackbar }        from "../../utils/snackbar-function";
import CustomizedSnackbars    from "../../components/customized-snackbar";
import {
  Dialog,
  DialogContent,
} from "../../components/ui/dialog";
import ResizableSplitPane from "../../components/ui/ResizableSplitPane";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "../../components/ui/alert-dialog";

interface Props {
  open:    boolean;
  onClose: () => void;
  requirement?: any;
  onRequirementUpdate?: () => void;
}

const ResumeParser: React.FC<Props> = ({ open, onClose, requirement, onRequirementUpdate }) => {
  const dispatch = useDispatch();
  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();
  const [file,       setFile]       = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [processing, setProcessing] = useState(false);
  const [stage,      setStage]      = useState<ProcessingStage>("");
  const [error,      setError]      = useState("");
  const [parsed,     setParsed]     = useState(false);
  const [fallbackParsed, setFallbackParsed] = useState(false);
  const [form,       setForm]       = useState<ParsedResume>({ ...EMPTY_FORM });
  const [duplicatePrompt, setDuplicatePrompt] = useState<{
    show: boolean;
    existingCandidate: any;
    existingMappings: any[];
    parsedData: any;
    resumeS3Key?: string;
  } | null>(null);

  const runStages = async () => {
    for (const s of PIPELINE_STAGES) {
      setStage(s.id);
      await new Promise<void>((r) => setTimeout(r, 650));
    }
  };

  const handleParse = async (f: File) => {
    setProcessing(true);
    setError("");
    setParsed(false);

    const stagesDone = runStages();

    try {
      const result = await dispatch(uploadResume({ file: f })).unwrap();
      await stagesDone;

      const parsed        = result?.data?.parsedData ?? result?.data;
      const existingCandidate  = result?.data?.existingCandidate;
      const existingMappings   = result?.data?.existingMappings;
      const resumeS3Key        = result?.data?.resumeS3Key as string | undefined;

      if (existingCandidate) {
        setDuplicatePrompt({
          show: true,
          existingCandidate,
          existingMappings: existingMappings || [],
          parsedData: parsed,
          resumeS3Key,
        });
      } else if (parsed) {
        const digits = parsed.phone ? parsed.phone.replace(/\D/g, "") : "";
        setForm((prev) => ({
          ...prev,
          candidateName:      parsed.name               ?? "",
          email:              parsed.email              ?? "",
          phone:              digits.length === 10 ? `91${digits}` : digits,
          location:           parsed.location           ?? "",
          totalExperience:    parsed.totalExperience    ?? "",
          relevantExperience: parsed.relevantExperience ?? "",
          skillSet:           parsed.skills
            ? parsed.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
            : [],
          confidence:         parsed.confidence ?? {},
          existingCandidateId: undefined,
          existingMappings:   [],
          resumeS3Key:        resumeS3Key ?? '',
        }));
        setParsed(true);
        if (parsed.parsedBy === 'fallback') setFallbackParsed(true);
      } else {
        setError("No data returned from resume parser.");
      }
    } catch (err) {
      await stagesDone;
      setError(err instanceof Error ? err.message : "Failed to parse resume.");
    } finally {
      setProcessing(false);
      setStage("");
    }
  };

  const acceptFile = (f: File) => {
    setError("");
    setFile(f);
    setParsed(false);
    setPreviewUrl((prev) => {
      if (prev) URL.revokeObjectURL(prev);
      const ext = f.name.split(".").pop()?.toLowerCase();
      return ext === "pdf" ? URL.createObjectURL(f) : null;
    });
    handleParse(f);
  };

  const handleFieldChange = (key: keyof ParsedResume, val: string) => {
    if (key === "skillSet") {
      setForm((f) => ({ ...f, skillSet: val.split(",,,").filter(Boolean) }));
    } else {
      setForm((f) => ({ ...f, [key]: val }));
    }
  };

  const handleClear = () => {
    setFile(null);
    setPreviewUrl(null);
    setParsed(false);
    setError("");
    setDuplicatePrompt(null);
    setForm({ ...EMPTY_FORM });
  };

  const handleClose = () => {
    handleClear();
    onClose();
  };

  return (
    <>
      <Dialog open={open} onOpenChange={(isOpen) => { if (!isOpen) handleClose(); }}>
        <DialogContent
          className="max-w-[95vw] w-[95vw] h-[90vh] p-0 overflow-hidden flex flex-col [&>button]:hidden"
          onInteractOutside={(e) => e.preventDefault()} 
        >
          {/* Processing overlay */}
          {processing && (
            <div  className="dialog-standard flex flex-col gap-0 overflow-hidden p-0">
              <ProcessingOverlay stage={stage} />
            </div>
          )}

          {/* Header */}
          <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 flex-shrink-0">
            <div>
              <h2 className="text-base font-bold text-gray-900">Add New Candidate</h2>
              <p className="text-xs text-gray-400">Upload resume to autofill or fill manually</p>
            </div>
            <button
              onClick={handleClose}
              className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-gray-100 text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <path d="M18 6L6 18M6 6l12 12" />
              </svg>
            </button>
          </div>

          {/* Body */}
          <main className="flex-1 min-h-0 overflow-hidden p-5">
            <ResizableSplitPane
              className="h-full"
              defaultRatio={0.5}
              minLeftPx={340}
              minRightPx={320}
              left={
                <div className="min-w-0 min-h-0 h-full">
                  <CandidateFormContainer
                    form={form}
                    parsed={parsed}
                    onChange={handleFieldChange}
                    onClear={handleClear}
                    onClose={handleClose}
                    requirement={requirement}
                    onRequirementUpdate={onRequirementUpdate}
                    onDuplicate={(existingCandidate, existingMappings) => {
                      setDuplicatePrompt({
                        show: true,
                        existingCandidate,
                        existingMappings,
                        parsedData: null,
                        resumeS3Key: form.resumeS3Key,
                      });
                    }}
                    showSuccessSnackbar={showSuccessSnackbar}
                    showErrorSnackbar={showErrorSnackbar}
                  />
                </div>
              }
              right={
                <div className="min-w-0 min-h-0 h-full">
                  <ResumePreview
                    file={file}
                    previewUrl={previewUrl}
                    error={error}
                    parsed={parsed}
                    processing={processing}
                    onFile={acceptFile}
                    onClear={handleClear}
                  />
                </div>
              }
            />
          </main>
        </DialogContent>
      </Dialog>

      {/* Duplicate Candidate Prompt */}
      <AlertDialog open={duplicatePrompt?.show || false}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Candidate Already Exists</AlertDialogTitle>
            <AlertDialogDescription>
              This candidate ({duplicatePrompt?.existingCandidate?.candidateName}) already exists in the system via{" "}
              {duplicatePrompt?.existingCandidate?.source || "another source"}. Would you like to
              load their existing profile and update it with the parsed resume data?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => { setDuplicatePrompt(null); handleClear(); }}>
              Cancel Upload
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!duplicatePrompt) return;
                const { existingCandidate, existingMappings, parsedData, resumeS3Key } = duplicatePrompt;

                // For phone: prefer parsed, then existing; normalize by stripping +91 / +
                const rawPhone = parsedData?.phone || existingCandidate.primaryContact || "";
                const digits = rawPhone.replace(/\D/g, "");
                const normalizedPhone = digits.startsWith("91") && digits.length === 12
                  ? digits
                  : digits.length === 10 ? `91${digits}` : digits;

                // For skills: prefer parsed, then existing
                const parsedSkills = parsedData?.skills
                  ? parsedData.skills.split(",").map((s: string) => s.trim()).filter(Boolean)
                  : null;
                const existingSkills = Array.isArray(existingCandidate.skillSet)
                  ? existingCandidate.skillSet
                  : typeof existingCandidate.skillSet === "string"
                    ? existingCandidate.skillSet.split(",").map((s: string) => s.trim()).filter(Boolean)
                    : [];

                setForm((prev) => ({
                  ...prev,
                  // Resume-parseable fields: prefer parsed data (newer resume), fallback to existing
                  candidateName:      parsedData?.name              || existingCandidate.candidateName || "",
                  email:              parsedData?.email             || existingCandidate.emailId       || "",
                  phone:              normalizedPhone,
                  location:           parsedData?.location          || existingCandidate.candidateLocation || "",
                  totalExperience:    parsedData?.totalExperience   || existingCandidate.totalExp      || "",
                  relevantExperience: parsedData?.relevantExperience|| existingCandidate.relExp        || "",
                  skillSet:           parsedSkills || existingSkills,
                  confidence:         parsedData?.confidence || {},

                  // Operational fields: keep existing candidate data
                  source:             existingCandidate.source      || prev.source || "",
                  dateOfJoining:      existingCandidate.dateOfJoining
                                        ? new Date(existingCandidate.dateOfJoining).toISOString().split("T")[0] : prev.dateOfJoining || "",
                  sourceDate:         existingCandidate.sourceDate
                                        ? new Date(existingCandidate.sourceDate).toISOString().split("T")[0] : prev.sourceDate || "",
                  date:               existingCandidate.date
                                        ? new Date(existingCandidate.date).toISOString().split("T")[0] : prev.date || "",
                  currentSalary:      existingCandidate.currentSalary  || prev.currentSalary  || "",
                  expectedSalary:     existingCandidate.expectedSalary || prev.expectedSalary || "",
                  noticePeriod:       existingCandidate.noticePeriod   || prev.noticePeriod   || "",
                  remarks:            existingCandidate.remarks ?? prev.remarks ?? "",

                  // Identity fields for update mode
                  existingCandidateId: existingCandidate.id,
                  existingMappings:   existingMappings || [],
                  resumeS3Key:        resumeS3Key ?? "",
                }));

                setParsed(true);
                setDuplicatePrompt(null);
              }}
            >
              Update Candidate
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Fallback Parser Alert */}
      <AlertDialog open={fallbackParsed}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2">
              <span>⚠️</span> AI Parser Unavailable
            </AlertDialogTitle>
            <AlertDialogDescription>
              Resume parsed using basic parser due to high AI server load. Please verify the details.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => {
                setFallbackParsed(false);
                handleClear();           // clears form so they can re-upload
              }}
            >
              Re-upload
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={() => setFallbackParsed(false)}  // keep data, proceed
            >
              Review Details
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
};

export default ResumeParser;
