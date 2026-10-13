import { useCallback, useEffect, useRef, useState } from 'react';
import { renderAsync } from 'docx-preview';
import { Download, FileText } from 'lucide-react';
import { Button } from '../ui/button';
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '../ui/dialog';

type DocumentResponse = {
  data: ArrayBuffer;
  headers?: Record<string, unknown>;
};

interface DocumentPreviewDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  fileKey?: string | null;
  fetchDocument: () => Promise<DocumentResponse>;
  showError?: (message: string) => void;
}

type PreviewMode = 'pdf' | 'docx' | 'text' | 'unsupported' | null;

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

function extractFileNameFromKey(key?: string | null): string {
  if (!key) return 'document';
  const leaf = key.split('/').pop()?.trim() || 'document';
  return leaf.replace(/^[0-9a-f-]{36}-(.+)$/i, '$1');
}

function extractFileNameFromDisposition(value?: string): string | null {
  if (!value) return null;
  const utf8Match = value.match(/filename\*=UTF-8''([^;]+)/i);
  if (utf8Match?.[1]) {
    return decodeURIComponent(utf8Match[1]);
  }
  const plainMatch = value.match(/filename="?([^"]+)"?/i);
  return plainMatch?.[1] ?? null;
}

function getExtension(fileName: string): string {
  const dotIndex = fileName.lastIndexOf('.');
  if (dotIndex < 0) return '';
  return fileName.slice(dotIndex + 1).toLowerCase();
}

function looksLikeZipDocument(arrayBuffer: ArrayBuffer): boolean {
  const bytes = new Uint8Array(arrayBuffer);
  return bytes.length >= 2 && bytes[0] === 0x50 && bytes[1] === 0x4b;
}

export default function DocumentPreviewDialog({
  open,
  onOpenChange,
  title,
  fileKey,
  fetchDocument,
  showError,
}: DocumentPreviewDialogProps) {
  const objectUrlRef = useRef<string | null>(null);
  const docxContainerRef = useRef<HTMLDivElement | null>(null);
  const previewZoneRef = useRef<HTMLDivElement | null>(null);
  const [loading, setLoading] = useState(false);
  const [previewMode, setPreviewMode] = useState<PreviewMode>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [previewText, setPreviewText] = useState<string | null>(null);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [downloadBlob, setDownloadBlob] = useState<Blob | null>(null);
  const [downloadName, setDownloadName] = useState('document');
  const [error, setError] = useState<string | null>(null);

  // ── Zoom state ──
  const [userZoom, setUserZoom] = useState(1);
  const clampZoom = (z: number) => Math.min(MAX_ZOOM, Math.max(MIN_ZOOM, z));

  const handleZoomIn = useCallback(() => {
    setUserZoom((z) => clampZoom(z + ZOOM_STEP));
  }, []);
  const handleZoomOut = useCallback(() => {
    setUserZoom((z) => clampZoom(z - ZOOM_STEP));
  }, []);
  const handleZoomReset = useCallback(() => {
    setUserZoom(1);
  }, []);

  // Ctrl+Wheel / trackpad pinch zoom
  useEffect(() => {
    const el = previewZoneRef.current;
    if (!el) return;
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      setUserZoom((z) => clampZoom(z + delta));
    };
    el.addEventListener('wheel', onWheel, { passive: false });
    return () => el.removeEventListener('wheel', onWheel);
  }, [open, previewMode]); // re-attach when dialog opens or content changes

  const clearObjectUrl = () => {
    if (objectUrlRef.current) {
      URL.revokeObjectURL(objectUrlRef.current);
      objectUrlRef.current = null;
    }
    setPreviewUrl(null);
  };

  const resetState = () => {
    clearObjectUrl();
    setPreviewMode(null);
    setPreviewText(null);
    setDocxBuffer(null);
    setDownloadBlob(null);
    setError(null);
    setUserZoom(1);
    setDownloadName(extractFileNameFromKey(fileKey));
    if (docxContainerRef.current) {
      docxContainerRef.current.innerHTML = '';
    }
  };

  useEffect(() => {
    if (!open) {
      resetState();
      return;
    }

    let active = true;
    const load = async () => {
      setLoading(true);
      setError(null);
      setPreviewText(null);
      setDocxBuffer(null);
      setPreviewMode(null);
      setUserZoom(1);
      clearObjectUrl();

      try {
        const response = await fetchDocument();
        if (!active) return;

        const headers = response.headers ?? {};
        const rawContentType = String(headers['content-type'] ?? '').toLowerCase();
        const contentType = rawContentType.split(';')[0];
        const disposition = String(headers['content-disposition'] ?? '');
        const resolvedName =
          extractFileNameFromDisposition(disposition) ||
          extractFileNameFromKey(fileKey) ||
          'document';
        const extension = getExtension(resolvedName);
        const arrayBuffer = response.data;
        const blob = new Blob([arrayBuffer], {
          type: contentType || 'application/octet-stream',
        });

        setDownloadBlob(blob);
        setDownloadName(resolvedName);

        if (contentType === 'application/pdf' || extension === 'pdf') {
          const url = URL.createObjectURL(blob);
          objectUrlRef.current = url;
          setPreviewUrl(url);
          setPreviewMode('pdf');
          return;
        }

        if (
          extension === 'docx' ||
          contentType.includes(
            'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
          ) ||
          looksLikeZipDocument(arrayBuffer)
        ) {
          setDocxBuffer(arrayBuffer);
          setPreviewMode('docx');
          return;
        }

        if (contentType.startsWith('text/') || extension === 'txt' || extension === 'dat') {
          const text = await blob.text();
          if (!active) return;
          setPreviewText(text);
          setPreviewMode('text');
          return;
        }

        setPreviewMode('unsupported');
      } catch (err) {
        console.error('Document preview failed', err);
        if (!active) return;
        setError('Could not load a preview for this file.');
        showError?.('Could not load a preview for this file');
      } finally {
        if (active) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      active = false;
      clearObjectUrl();
    };
  }, [open, fileKey, fetchDocument, showError]);

  useEffect(() => {
    if (previewMode !== 'docx' || !docxBuffer || !docxContainerRef.current) {
      return;
    }

    let active = true;
    const container = docxContainerRef.current;
    container.innerHTML = '';

    renderAsync(docxBuffer, container, undefined, {
      className: 'ta-docx',
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
    }).catch((err) => {
      console.error('DOCX render failed', err);
      if (!active) return;
      setError('Could not render this DOCX file.');
      showError?.('Could not render this DOCX file');
    });

    return () => {
      active = false;
      container.innerHTML = '';
    };
  }, [docxBuffer, previewMode, showError]);

  const handleDownload = () => {
    if (!downloadBlob) return;
    const url = URL.createObjectURL(downloadBlob);
    const anchor = document.createElement('a');
    anchor.href = url;
    anchor.download = downloadName || 'document';
    document.body.appendChild(anchor);
    anchor.click();
    anchor.remove();
    URL.revokeObjectURL(url);
  };

  const hasContent = previewMode && !loading && !error;
  const zoomPercent = Math.round(userZoom * 100);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-[min(100%,96vw)] max-w-5xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="border-b border-slate-200 bg-slate-50 px-5 py-4 text-left">
          <div className="flex items-center justify-between pr-8">
            <div>
              <DialogTitle className="flex items-center gap-2 text-base font-semibold text-[var(--brand)]">
                <FileText className="h-4 w-4" />
                <span>{title}</span>
              </DialogTitle>
              <p className="text-xs text-slate-500 mt-0.5">{downloadName}</p>
            </div>

            {/* Zoom toolbar */}
            {hasContent && (
              <div className="flex items-center gap-1 px-2 py-1 bg-white border border-slate-200 rounded-lg shadow-sm">
                <button
                  onClick={handleZoomOut}
                  disabled={userZoom <= MIN_ZOOM}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100
                    text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed
                    transition-colors text-sm font-bold"
                  title="Zoom out"
                >
                  −
                </button>

                <button
                  onClick={handleZoomReset}
                  className="px-1.5 min-w-[44px] h-7 text-[11px] font-semibold text-slate-600
                    hover:bg-slate-100 rounded transition-colors text-center"
                  title="Reset zoom"
                >
                  {zoomPercent}%
                </button>

                <button
                  onClick={handleZoomIn}
                  disabled={userZoom >= MAX_ZOOM}
                  className="w-7 h-7 flex items-center justify-center rounded hover:bg-slate-100
                    text-slate-500 hover:text-slate-700 disabled:opacity-30 disabled:cursor-not-allowed
                    transition-colors text-sm font-bold"
                  title="Zoom in"
                >
                  +
                </button>
              </div>
            )}
          </div>
        </DialogHeader>

        <div ref={previewZoneRef} className="min-h-[60vh] max-h-[72vh] overflow-auto bg-slate-100 p-4">
          {loading ? (
            <div className="flex h-[56vh] items-center justify-center rounded-xl border border-slate-200 bg-white">
              <div className="text-sm text-slate-500">Loading document preview…</div>
            </div>
          ) : error ? (
            <div className="flex h-[56vh] items-center justify-center rounded-xl border border-rose-200 bg-white px-6 text-sm text-rose-600">
              {error}
            </div>
          ) : previewMode === 'pdf' && previewUrl ? (
            <div className="overflow-auto rounded-xl border border-slate-200 bg-white">
              <iframe
                src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                title={title}
                className="border-0"
                style={{
                  width: `${100 / userZoom}%`,
                  height: `${64 / userZoom}vh`,
                  transform: `scale(${userZoom})`,
                  transformOrigin: 'top left',
                }}
              />
            </div>
          ) : previewMode === 'docx' ? (
            <div className="rounded-xl border border-slate-200 bg-white overflow-hidden">
              <div
                ref={docxContainerRef}
                className="ta-docx-shell max-h-[64vh] overflow-auto bg-white p-4"
                style={{
                  transform: userZoom !== 1 ? `scale(${userZoom})` : undefined,
                  transformOrigin: 'top center',
                  width: userZoom !== 1 ? `${100 / userZoom}%` : '100%',
                }}
              />
            </div>
          ) : previewMode === 'text' && previewText != null ? (
            <div className="rounded-xl border border-slate-200 bg-white">
              <pre
                className="max-h-[64vh] overflow-auto whitespace-pre-wrap break-words p-6 leading-relaxed text-slate-700"
                style={{
                  fontSize: `${Math.max(10, 12 * userZoom)}px`,
                }}
              >
                {previewText}
              </pre>
            </div>
          ) : previewMode === 'unsupported' ? (
            <div className="flex h-[56vh] flex-col items-center justify-center gap-3 rounded-xl border border-slate-200 bg-white px-6 text-center">
              <p className="text-sm font-medium text-slate-700">
                Preview is not available for this file type.
              </p>
              <p className="text-xs text-slate-500">
                Use the download button to open it in the appropriate desktop app.
              </p>
            </div>
          ) : null}
        </div>

        <DialogFooter className="border-t border-slate-200 bg-white px-5 py-3">
          <Button type="button" onClick={handleDownload} disabled={!downloadBlob}>
            <Download className="mr-2 h-4 w-4" />
            Download
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
