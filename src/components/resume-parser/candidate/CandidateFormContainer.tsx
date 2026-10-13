import React, { useEffect, useMemo, useRef, useState } from "react";
import { useDispatch, useAppSelector } from "../../../store";
import { RootState } from "../../../store/reducers";
import { fetchStatus } from "../../../store/action/status.action";
import { fetchAllUsers } from "../../../store/action/users.action";
import { fetchAllRequirement } from "../../../store/action/requirement-details.action";
import { createCandidate, UpdateCandidateInd, FetchAllCandidate } from "../../../store/action/candidate.action";
import CandidateForm from "./CandidateForm";
import type { ParsedResume } from "../types";
import { validateProfileSharedDate } from "../../../utils/name-format";

// ── exported so sections can import it ────────────────────────────────
export interface CandidateFormErrors {
  candidateName:      string;
  email:              string;
  phone:              string;
  location:           string;
  totalExperience:    string;
  relevantExperience: string;
  skillSet:           string;
  source:             string;
  date:               string;
  dateOfJoining:       string;
  sourceDate:         string;
  currentSalary:      string;
  expectedSalary:     string;
  noticePeriod:       string;
  requirementId:      string;
  candidateStatusId:  string;
  uploadedById:       string;
  remarks:            string;
}

export const EMPTY_FORM_ERRORS: CandidateFormErrors = {
  candidateName:      "",
  email:              "",
  phone:              "",
  location:           "",
  totalExperience:    "",
  relevantExperience: "",
  skillSet:           "",
  source:             "",
  date:               "", 
  dateOfJoining:       "",
  sourceDate:         "",
  currentSalary:      "",
  expectedSalary:     "",
  noticePeriod:       "",
  requirementId:      "",
  candidateStatusId:  "",
  uploadedById:       "",
  remarks:            "",
};

interface Props {
  form:     ParsedResume;
  parsed:   boolean;
  onChange: (key: keyof ParsedResume, val: string) => void;
  onClear:  () => void;
  onClose:  () => void;
  requirement?: any;
  onRequirementUpdate?: () => void;
  onDuplicate?: (existingCandidate: any, existingMappings: any[]) => void;
  showSuccessSnackbar: (message: string, duration?: number) => void;
  showErrorSnackbar: (message: string, duration?: number) => void;
}

const validateEmail = (email: string) =>
  /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(email);

const CandidateFormContainer: React.FC<Props> = ({
  form,
  parsed,
  onChange,
  onClear,
  onClose,
  requirement,
  onRequirementUpdate,
  onDuplicate,
  showSuccessSnackbar,
  showErrorSnackbar,
}) => {
  const mappedRequirementIds = useMemo(
    () =>
      new Set(
        (form.existingMappings ?? [])
          .map((m: any) => Number(m?.requirementDetails?.id ?? m?.requirementId))
          .filter((id: number) => Number.isFinite(id) && id > 0),
      ),
    [form.existingMappings],
  );

  useEffect(() => {
    if (!requirement?.id) return;
    const mid = Number(requirement.id);
    if (mappedRequirementIds.has(mid)) {
      onChange("requirementId", "");
      onChange("candidateStatusId", "");
    } else {
      onChange("requirementId", String(requirement.id));
    }
  }, [requirement?.id, mappedRequirementIds]);
  const dispatch = useDispatch();
  const { user }         = useAppSelector((s: RootState) => s.authSelector);
  const { requirements } = useAppSelector((s: RootState) => s.requirementsSelector);
  const { status }       = useAppSelector((s: RootState) => s.statusSelector);
  const { users: _users } = useAppSelector((s: RootState) => s.usersSelector);

  const [errors,     setErrors]     = useState<CandidateFormErrors>({ ...EMPTY_FORM_ERRORS });
  const [submitting, setSubmitting] = useState(false);
  const [existingMappingStatusByReqId, setExistingMappingStatusByReqId] = useState<
    Record<string, string>
  >({});
  /** requirement id (string) → scheduled interview datetime (ISO string) */
  const [scheduledByReqId, setScheduledByReqId] = useState<Record<string, string>>({});
  const mappingBaselineRef = useRef<any[]>([]);

  useEffect(() => {
    const list = form.existingMappings ?? [];
    if (list.length === 0) {
      mappingBaselineRef.current = [];
      setExistingMappingStatusByReqId({});
      return;
    }
    mappingBaselineRef.current = [...list];
    const init: Record<string, string> = {};
    for (const m of list) {
      const rid = String(m?.requirementDetails?.id ?? m?.requirementId ?? "");
      if (!rid || rid === "undefined") continue;
      init[rid] = m?.status?.id != null ? String(m.status.id) : "";
    }
    setExistingMappingStatusByReqId(init);
  }, [form.existingCandidateId, form.existingMappings]);

  // ── fetch dropdown data on mount ──────────────────────────────────────
  useEffect(() => {
    dispatch(fetchStatus());
    dispatch(fetchAllUsers());
    dispatch(fetchAllRequirement());
  }, [dispatch]);

  // ── field change — clears error for that field ────────────────────────
  const handleChange = (key: keyof ParsedResume, val: string) => {
    onChange(key, val);
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── validation ────────────────────────────────────────────────────────
  // Only 4 fields are mandatory: candidateName, email, phone, source
  const validate = (): { isValid: boolean; errors: CandidateFormErrors } => {
    const e: CandidateFormErrors = { ...EMPTY_FORM_ERRORS };
    let valid = true;

    if (!form.candidateName.trim())
      { e.candidateName = "Candidate name is required"; valid = false; }

    if (!form.email.trim())
      { e.email = "Email is required"; valid = false; }
    else if (!validateEmail(form.email))
      { e.email = "Enter a valid email"; valid = false; }

    if (!form.phone.trim())
      { e.phone = "Phone number is required"; valid = false; }
    else if (form.phone.replace(/\D/g, "").length < 10)
      { e.phone = "Enter a valid 10-digit number"; valid = false; }

    if (!form.source?.trim())
      { e.source = "Source is required"; valid = false; }

    if (!form.sourceDate?.trim())
      { e.sourceDate = "Source Date is required"; valid = false; }

    if (!form.currentSalary?.trim())
      { e.currentSalary = "Current Salary is required"; valid = false; }

    if(!form.noticePeriod?.trim())
      { e.noticePeriod = "Notice Period is required"; valid = false; }

     // Profile Shared Date must not be earlier than Source Date (equal is allowed)
    const profileDateError = validateProfileSharedDate(form.sourceDate, form.date);
    if (profileDateError)
      { e.date = profileDateError; valid = false; }

    if (!user?.id)
      { e.uploadedById = "Please select uploaded by"; valid = false; }

    setErrors(e);
    return { isValid: valid, errors: e };
  };

  // ── submit ────────────────────────────────────────────────────────────
  const handleSubmit =  async (scrollToError?: (errors: Record<string, any>) => void) => {
    const { isValid, errors: validationErrors } = validate();
    if (!isValid) {
     scrollToError?.(validationErrors);
      return;
    }
    setSubmitting(true);

    const requirementMappings: any[] = [];

    for (const m of mappingBaselineRef.current) {
      const reqIdStr = String(m?.requirementDetails?.id ?? m?.requirementId ?? "");
      if (!reqIdStr || reqIdStr === "undefined") continue;
      const prevStatusId = m?.status?.id ?? null;
      const selected = existingMappingStatusByReqId[reqIdStr] ?? "";
      if (!selected) continue;
      const nextStatusId = parseInt(selected, 10);
      if (Number.isNaN(nextStatusId)) continue;
      if (nextStatusId === prevStatusId) continue;
      const clientId = m?.client?.id ?? m?.requirementDetails?.client?.id;
      const scheduledTime = scheduledByReqId[reqIdStr];
      const entry: any = {
        requirementId: parseInt(reqIdStr, 10),
        statusId: nextStatusId,
        ...(scheduledTime && {
          scheduledInterviewAt: scheduledTime,
        }),
      };
      if (clientId) entry.clientId = clientId;
      requirementMappings.push(entry);
    }

    if (form.requirementId) {
      const selectedReq = requirements.find(
        (r: any) => r.id === parseInt(form.requirementId ?? "0")
      );
      if (selectedReq) {
        const mapping: any = {
          requirementId: parseInt(form.requirementId),
          clientId:
            selectedReq.client?.id ?? selectedReq.client?.clientProfile?.id,
        };
        if (form.candidateStatusId) {
          mapping.statusId = parseInt(form.candidateStatusId);
        }
        const scheduledTime = scheduledByReqId['__new__'];
        if (scheduledTime) {
          mapping.scheduledInterviewAt = scheduledTime;
        }
        if (form.date?.trim()) {              
          mapping.profileSharedDate = form.date;
        }
        requirementMappings.push(mapping);
      }
    }

    const payload: any = {
      candidateName:     form.candidateName,
      emailId:           form.email,
      primaryContact:    form.phone,
      source:            form.source            ?? "",
      uploadedBy: { id: parseInt(user?.id?.toString() ?? "0") },
      createdBy:  { id: user?.id },
    };

    // Only include optional fields if they have values
    if (form.location?.trim())           payload.candidateLocation = form.location;
    if (form.totalExperience?.trim())    payload.totalExp          = form.totalExperience;
    if (form.relevantExperience?.trim()) payload.relExp            = form.relevantExperience;
    if (form.skillSet.length > 0)        payload.skillSet          = form.skillSet;
    if (form.date?.trim())               payload.date              = form.date;
    if (form.dateOfJoining?.trim())       payload.dateOfJoining     = form.dateOfJoining;
    if (form.sourceDate?.trim())         payload.sourceDate        = form.sourceDate;
    if (form.currentSalary?.trim())      payload.currentSalary     = form.currentSalary;
    if (form.expectedSalary?.trim())     payload.expectedSalary    = form.expectedSalary;
    if (form.noticePeriod?.trim())       payload.noticePeriod      = form.noticePeriod;
    if (!form.existingCandidateId && form.remarks?.trim()) {
      payload.remarks = form.remarks.trim();
    }
    if (requirementMappings.length > 0)  payload.requirementMappings = requirementMappings;
    if (form.resumeS3Key?.trim())       payload.resumeS3Key = form.resumeS3Key.trim();

    try {
      if (form.existingCandidateId) {
        // Remove fields not allowed in the update DTO
        delete payload.uploadedBy;
        delete payload.createdBy;
        payload.updatedBy = { id: user?.id };
        payload.remarks = form.remarks?.trim() ?? '';
        const response = await dispatch(UpdateCandidateInd({ id: form.existingCandidateId, payload: payload as any })).unwrap();
        if (response?.statusCode === 409) {
          showErrorSnackbar(response?.message ?? "Email or phone already exists for another candidate");
          return;
        }
        if (response?.success && response?.statusCode === 200) {
          showSuccessSnackbar(response?.message ?? "Candidate updated successfully");
          const hasJoinedStatus = requirementMappings.some((m: any) => m.statusId === 63);
          if (hasJoinedStatus) {
            onRequirementUpdate?.(); 
          }
          dispatch(FetchAllCandidate());
          onClear();
          onClose();
        } else {
          showErrorSnackbar(response?.message ?? "Failed to update candidate");
        }
      } else {
        const response = await dispatch(createCandidate(payload as any)).unwrap() as any;

        if (response?.statusCode === 409) {
          const existingCandidate = response?.data?.existingCandidate;
          const existingMappings = response?.data?.existingMappings ?? [];
          if (existingCandidate && onDuplicate) {
            onDuplicate(existingCandidate, existingMappings);  // ← triggers AlertDialog in ResumeParser
          } else {
            showErrorSnackbar(response?.message ?? "Candidate already exists");
          }
          return; // ← don't close the modal
        }

        const isCreatedSuccessfully =
          response?.success === true ||
          response?.statusCode === 201 ||
          (response?.id != null && response?.candidateName != null);

        if (isCreatedSuccessfully) {
          showSuccessSnackbar(response?.message ?? "Candidate created successfully");
          dispatch(FetchAllCandidate());
          onClear();
          onClose();
        } else {
          showErrorSnackbar(response?.message ?? "Failed to create candidate");
        }
      }
    } catch {
      showErrorSnackbar("An error occurred while saving the candidate");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <CandidateForm
        form={form}
        parsed={parsed}
        errors={errors}
        submitting={submitting}
        requirements={requirements ?? []}
        statuses={status          ?? []}
        existingMappingStatusByReqId={existingMappingStatusByReqId}
        scheduledByReqId={scheduledByReqId}
        onScheduledByReqIdChange={setScheduledByReqId}
        onExistingMappingStatusChange={(reqKey, statusId) =>
          setExistingMappingStatusByReqId((prev) => ({ ...prev, [reqKey]: statusId }))
        }
        onChange={handleChange}
        onSubmit={(scrollToError) => handleSubmit(scrollToError)}
        onClear={onClear}
      />
    </>
  );
};

export default CandidateFormContainer;