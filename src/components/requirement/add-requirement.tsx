import { useState, useEffect, useRef } from 'react';
import { X } from 'lucide-react';
import { fetchClientLocations } from '../../store/action/client-location.action';
import { useSnackbar } from '../../utils/snackbar-function';
import CustomizedSnackbars from '../customized-snackbar';
import PositionAutocomplete from '../client/PositionAutocomplete';
import { renderAsync } from 'docx-preview';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '../ui/dialog';

import { useDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import {
  createRequirementDetail,
  fetchAllRequirement,
  parseJD,
} from '../../store/action/requirement-details.action';

import { client } from '../../store/model/client.types';

import { Button } from '../ui/button';
import { Input } from '../ui/input';
import { Label } from '../ui/label';

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '../ui/select';

const AddRequirementForm = ({ isOpen, onClose }: any) => {
  const dispatch = useDispatch();

  const [file, setFile] = useState<File | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [pdfUrl, setPdfUrl] = useState('');
  const docxContainerRef = useRef<HTMLDivElement | null>(null);

  const { clients } =
    useAppSelector((state: RootState) => state.clientsSelector) || { clients: [] };

  const { user } =
    useAppSelector((state: RootState) => state.authSelector) || {};

  const {
    snackbarState,
    showSuccessSnackbar,
    showErrorSnackbar,
    handleSnackbarClose,
  } = useSnackbar();

  const [showConfirm, setShowConfirm] = useState(false);
  const [, setPendingPayload] = useState<any>(null);
  const [jrfS3Key, setJrfS3Key] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    position: '',
    skill: '',
    experience: '',
    client_id: '',
    position_detail_id: '',
  });

  const resetForm = () => {
    setFormData({
      position: '',
      skill: '',
      experience: '',
      client_id: '',
      position_detail_id: '',
    });

    setFile(null);
    setDocxBuffer(null);
    setPdfUrl('');
    setPendingPayload(null);
    setShowConfirm(false);
    setJrfS3Key(null);
  };

  useEffect(() => {
    if (isOpen) resetForm();
  }, [isOpen]);

  useEffect(() => {
    dispatch(fetchClientLocations());
  }, [dispatch]);

  // 🔒 Disable scroll
  useEffect(() => {
    document.body.style.overflow = isOpen ? 'hidden' : 'auto';
    return () => {
      document.body.style.overflow = 'auto';
    };
  }, [isOpen]);

  const handleUpload = async () => {
    if (!file) return;

    if (file.name.endsWith('.docx')) {
      const arrayBuffer = await file.arrayBuffer();
      setDocxBuffer(arrayBuffer);
      setPdfUrl('');
    } else if (file.type === 'application/pdf') {
      const url = URL.createObjectURL(file);
      setPdfUrl(url);
      setDocxBuffer(null);
    }

    try {
      const res = await dispatch(parseJD(file)).unwrap();
      setJrfS3Key(typeof res?.jrfS3Key === 'string' && res.jrfS3Key ? res.jrfS3Key : null);

      setFormData((prev) => ({
        ...prev,
        position: res.positions?.toString() || '',
        skill: res.skills?.join('\n') || '',
        experience: res.experience || '',
      }));
    } catch (err) {
    }
  };

  const handleSubmit = async (e: any) => {
    e.preventDefault();

    const skills = formData.skill
      .split(/[\n,]+/)
      .map((s) => s.trim())
      .filter(Boolean);
    const payload: any = {
      noOfPosition: Number(formData.position),
      relExp: Number(formData.experience),
      skillSet: skills.length ? skills : undefined,
      client: { id: Number(formData.client_id) },
      positionDetails: { id: Number(formData.position_detail_id) },
      createdBy: { id: user?.id },
      isActive: true,
    };
    if (jrfS3Key) payload.jrfS3Key = jrfS3Key;

    try {
      const response: any = await dispatch(
        createRequirementDetail(payload)
      ).unwrap();

      if (
        response?.message?.toLowerCase().includes('already exists') ||
        response?.success === false
      ) {
        setPendingPayload(payload);
        setShowConfirm(true);
        return;
      }

      await dispatch(fetchAllRequirement());
      await showSuccessSnackbar('Requirement added successfully');

      resetForm();
      setTimeout(() => onClose(), 900);
    } catch (error: any) {
      await showErrorSnackbar('Failed to add requirement');
    }
  };

  if (!isOpen) return null;

  useEffect(() => {
    if (!docxBuffer || !docxContainerRef.current) {
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = '';
      }
      return;
    }

    const container = docxContainerRef.current;
    container.innerHTML = '';

    renderAsync(docxBuffer, container, undefined, {
      className: 'requirement-docx',
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
    }).catch((err) => {
      console.error('Requirement DOCX preview failed:', err);
      container.innerHTML = `
        <div class="p-6 text-sm text-amber-700 leading-relaxed">
          <p class="mt-1">
            The document may contain scanned images or unsupported formatting.
            Please upload a text-based PDF, DOCX, or TXT resume.
          </p>
        </div>
      `;
    });

    return () => {
      container.innerHTML = '';
    };
  }, [docxBuffer]);

  return (
    <>
      <div
        className="fixed inset-0 z-[9998] backdrop-blur-md bg-black/30"
        onClick={onClose}
      />
      <div className="fixed inset-0 top-6 z-[9999] flex justify-center items-start px-6">
        <div className="w-[92%] h-[87vh] bg-white rounded-xl shadow-xl flex overflow-hidden">

          {/* LEFT */}
          <div className="w-1/2 p-6 overflow-y-auto">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Add New Requirement</h2>
              <button onClick={onClose}>
                <X className="w-5 h-5 text-gray-500 hover:text-black" />
              </button>
            </div>

            <div className="border-2 border-dashed rounded-lg p-4 mb-6 text-center">
              <input
                type="file"
                onChange={(e) => setFile(e.target.files?.[0] || null)}
              />
              <Button onClick={handleUpload} className="mt-2 w-full bg-[#1E3A5F] hover:bg-[#162d47] text-white">
                Upload JD
              </Button>
            </div>

            <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
              <div>
                <Label>Client</Label>
                <Select
                  value={formData.client_id}
                  onValueChange={(v) =>
                    setFormData((prev) => ({ ...prev, client_id: v }))
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select client" />
                  </SelectTrigger>
                  <SelectContent>
                    {(clients ?? []).map((c: client) => (
                      <SelectItem key={c.id} value={String(c.id)}>
                        {c.clientName}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ✅ POSITION AUTOCOMPLETE */}
              <div>
                <Label>Position</Label>

                <PositionAutocomplete
                  value={
                    formData.position_detail_id
                      ? Number(formData.position_detail_id)
                      : undefined
                  }
                  onChange={(id) => {
                    setFormData((prev) => ({
                      ...prev,
                      position_detail_id: String(id),
                    }));
                  }}
                />
              </div>

              <div>
                <Label>No. of Positions</Label>
                <Input
                  value={formData.position}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      position: e.target.value,
                    }))
                  }
                />
              </div>

              <div>
                <Label>Experience</Label>
                <Input
                  value={formData.experience}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      experience: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-span-2">
                <Label>Skills</Label>
                <textarea
                  className="w-full border rounded p-2"
                  rows={4}
                  value={formData.skill}
                  onChange={(e) =>
                    setFormData((prev) => ({
                      ...prev,
                      skill: e.target.value,
                    }))
                  }
                />
              </div>

              <div className="col-span-2">
                <Button type="submit" className="w-full bg-[#1E3A5F] hover:bg-[#162d47] text-white">
                  Add Requirement
                </Button>
              </div>
            </form>
          </div>

          {/* RIGHT */}
          <div className="w-1/2 p-6 bg-gray-50 overflow-auto border-l">
            <h2 className="mb-4 font-semibold">JD Preview</h2>

            {pdfUrl && (
              <iframe src={pdfUrl} className="w-full h-[75vh] rounded" />
            )}

            {docxBuffer && (
              <div
                ref={docxContainerRef}
                className="w-full h-[75vh] overflow-auto rounded bg-white p-4"
              />
            )}
          </div>
        </div>
      </div>

      {/* DUPLICATE */}
      <Dialog open={showConfirm} onOpenChange={setShowConfirm}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="text-red-600">
              ⚠️ Requirement Already Exists
            </DialogTitle>
          </DialogHeader>
          <p>This requirement already exists.</p>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowConfirm(false)}>
              Cancel
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* SNACKBAR */}
      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />
    </>
  );
};

export default AddRequirementForm;
