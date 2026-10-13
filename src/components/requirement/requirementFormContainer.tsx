import { useEffect, useState } from "react";
import { useDispatch, useAppSelector } from "../../store";
import { RootState } from "../../store/reducers";
import {
  createRequirementDetail,
  fetchAllRequirement,
  parseJD,
} from "../../store/action/requirement-details.action";
import { fetchPositionDetails } from "../../store/action/position-details.action";
import { fetchClientLocations } from '../../store/action/client-location.action';
import { client } from "../../store/model/client.types";
import { Position } from "../../store/model/position-details.types";
import { useSnackbar } from "../../utils/snackbar-function";
import CustomizedSnackbars from "../customized-snackbar";
import RequirementForm, {
  RequirementFormData,
  RequirementFormErrors,
  EMPTY_REQUIREMENT_ERRORS,
} from "./requirementFrom";

interface Props {
  isOpen:  boolean;
  onClose: () => void;
}

const RequirementFormContainer: React.FC<Props> = ({ isOpen, onClose }) => {
  const dispatch = useDispatch();
  const { clients } = useAppSelector((s: RootState) => s.clientsSelector) || { clients: [] };
  const { positions }       = useAppSelector((s: RootState) => s.positionDetailsSelector) || {};
  const { user }            = useAppSelector((s: RootState) => s.authSelector) || {};

  const { snackbarState, showSuccessSnackbar, showErrorSnackbar, handleSnackbarClose } =
    useSnackbar();

  const [form, setForm] = useState<RequirementFormData>({
    noOfPositions:           "",
    skill:              [],
    experience:         "",
    client_id:          "",
    position_detail_id: "",
    position: "",
  });

  const [errors,     setErrors]     = useState<RequirementFormErrors>({ ...EMPTY_REQUIREMENT_ERRORS });
  const [submitting, setSubmitting] = useState(false);
//   const [uploading,  setUploading]  = useState(false);
  const [file,       setFile]       = useState<File | null>(null);
  const [jrfS3Key,   setJrfS3Key]   = useState<string | null>(null);
//   const [previewHtml, setPreviewHtml] = useState("");
  const [pdfUrl,      setPdfUrl]      = useState("");

  // ── reset on open ───────
  useEffect(() => {
    if (isOpen) {
      setForm({ noOfPositions: "", skill: [], experience: "", client_id: "", position_detail_id: "",position:"" });
      setErrors({ ...EMPTY_REQUIREMENT_ERRORS });
      setFile(null);
      setPdfUrl("");
      setJrfS3Key(null);
    }
  }, [isOpen]);

  // ── fetch dropdowns ────
  useEffect(() => {
    dispatch(fetchPositionDetails());
    dispatch(fetchClientLocations());
  }, [dispatch]);

  // ── field change ──────
  const handleChange = (key: keyof RequirementFormData, val: string | string[]) => {
    setForm((p) => ({ ...p, [key]: val }));
    setErrors((p) => ({ ...p, [key]: "" }));
  };

  // ── file change + preview ────────
  const handleFileChange = (f: File | null) => {
    setFile(f);
    setPdfUrl("");
    if (f) handleUpload(f);
  };

  // ── clear all ───────
    const handleClear = () => {
        setForm({
            noOfPositions:      "",
            skill:              [],
            experience:         "",
            client_id:          "",
            position_detail_id: "",
            position: "",
        });
        setFile(null);
        setPdfUrl("");
        setJrfS3Key(null);
        setErrors({ ...EMPTY_REQUIREMENT_ERRORS });
        };

  // ── upload + parse JD ────
  const handleUpload = async (f?: File) => {
    const fileToUse = f || file;
    if (!fileToUse) return;

    try {
        if (fileToUse.type === "application/pdf") {
        setPdfUrl(URL.createObjectURL(fileToUse));
        } else {
        setPdfUrl("");
        }

        const res = await dispatch(parseJD(fileToUse)).unwrap();
        setJrfS3Key(typeof res?.jrfS3Key === 'string' && res.jrfS3Key ? res.jrfS3Key : null);
        setForm((prev) => ({
        ...prev,
        noOfPositions: res.positions?.toString() ?? "",
        skill:         res.skills               ?? [],
        experience:    res.experience            ?? "",
        }));
        setErrors((prev) => ({
        ...prev,
        noOfPositions: "",
        skill:         "",
        experience:    "",
        }));
    } catch (err) {
        console.error("Parse JD error:", err);
    }
 };

  // ── validation ───
  const validate = (): boolean => {
    const e: RequirementFormErrors = { ...EMPTY_REQUIREMENT_ERRORS };
    let valid = true;

    if (!form.client_id)          { e.client_id = "Please select a client"; valid = false; }
    //if (!form.position_detail_id) { e.position_detail_id = "Please select a position"; valid = false; }
    if (!form.noOfPositions.trim())    { e.noOfPositions = "No. of positions is required"; valid = false; }
    if (!form.experience.trim())  { e.experience = "Experience is required"; valid = false; }
    if (form.skill.length === 0)  { e.skill = "At least one skill is required"; valid = false; }

    setErrors(e);
    return valid;
  };

  // ── submit ──
  const handleSubmit = async () => {
    if (!validate()) return;
    setSubmitting(true);

    const payload: Record<string, unknown> = {
      noOfPosition:     form.noOfPositions,
      relExp:           form.experience,
      skillSet:         [...form.skill],
      client:           { id: Number(form.client_id) },
      positionDetails:  { id: Number(form.position_detail_id) },
      createdBy:        { id: user?.id },
      isActive:         true,
    };
    if (jrfS3Key) payload.jrfS3Key = jrfS3Key;

    try {
      const response: any = await dispatch(createRequirementDetail(payload as any)).unwrap();

      if (response?.message?.toLowerCase().includes("already exists") || response?.success === false) {
        showErrorSnackbar("This requirement already exists.");
        return;
      }

      await dispatch(fetchAllRequirement());
      showSuccessSnackbar("Requirement added successfully");
      setTimeout(() => onClose(), 900);
    } catch {
      showErrorSnackbar("Failed to add requirement");
    } finally {
      setSubmitting(false);
    }
  };

  // ── dropdown options ───
  const clientOptions = (clients ?? []).map((c: client) => ({
    value: String(c.id),
    label: c.clientName,
    }));
  const positionOptions = (positions ?? []).map((p: Position) => ({
    value: String(p.id),
    label: p.positionName,
  }));

  if (!isOpen) return null;

  return (
    <>
      <RequirementForm
        form={form}
        errors={errors}
        submitting={submitting}
        file={file}
        pdfUrl={pdfUrl}
        clientOptions={clientOptions}
        positionOptions={positionOptions}
        onChange={handleChange}
        onFileChange={handleFileChange}
        onSubmit={handleSubmit}
        onClose={onClose}
        onClear={handleClear}
      />
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
};

export default RequirementFormContainer;
