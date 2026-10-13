import React, { useCallback, useEffect, useRef, useState } from "react";
import { renderAsync } from "docx-preview";

interface Props {
  file:       File | null;
  previewUrl: string | null;
  error:      string;
  parsed:     boolean;
  processing: boolean;
  onFile:     (f: File) => void;
  onClear:    () => void;
  title?:     string;
  infoDots?:  string[];
  showError?: (msg: string) => void;
}

const MIN_ZOOM = 0.25;
const MAX_ZOOM = 3;
const ZOOM_STEP = 0.1;

const ResumePreview: React.FC<Props> = ({
  file, previewUrl, error, parsed, processing, onFile, onClear,showError,
}) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const docxShellRef = useRef<HTMLDivElement>(null);
  const docxContainerRef = useRef<HTMLDivElement>(null);
  const previewZoneRef = useRef<HTMLDivElement>(null);
  const [dragging,   setDragging]   = useState(false);
  const [docxBuffer, setDocxBuffer] = useState<ArrayBuffer | null>(null);
  const [datText,    setDatText]    = useState<string | null>(null);
  const [converting, setConverting] = useState(false);
  const [docxScale,  setDocxScale]  = useState(1);
  const [docxSize,   setDocxSize]   = useState({ width: 0, height: 0 });
  const [dialogOpen, setDialogOpen] = useState(false);
  // ── User zoom (separate from auto-fit) ──
  const [userZoom, setUserZoom] = useState(1);
  const baseScaleRef = useRef(1); // stores the auto-fit base

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

  // ── Ctrl+Wheel / trackpad pinch zoom ──
  useEffect(() => {
    const el = previewZoneRef.current;
    if (!el) return;

    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return;
      e.preventDefault();
      const delta = -e.deltaY * 0.005;
      setUserZoom((z) => clampZoom(z + delta));
    };

    el.addEventListener("wheel", onWheel, { passive: false });
    return () => el.removeEventListener("wheel", onWheel);
  }, [file]);

  // Reset zoom when file changes
  useEffect(() => {
    setUserZoom(1);
  }, [file]);

  useEffect(() => {
    const onFocus = () => {
      setTimeout(() => setDialogOpen(false), 300);
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, []);

  const accept = (f: File) => {
    const ext = f.name.split(".").pop()?.toLowerCase() ?? "";
    const allowed = ["pdf", "docx", "doc", "txt", "dat"];
    if (!allowed.includes(ext)) {
      showError?.(
        `"${f.name}" is not supported.\nPlease upload PDF, DOC, DOCX, TXT, or DAT files.`
      );
      return;
    }
    onFile(f);
  };

  useEffect(() => {
    if (!file) {
      setDocxBuffer(null);
      setDatText(null);
      setDocxScale(1);
      setDocxSize({ width: 0, height: 0 });
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = "";
      }
      return;
    }
    const ext = file.name.split(".").pop()?.toLowerCase();
    const reader = new FileReader();
    setConverting(true);
    reader.onload = async (e) => {
      const arrayBuffer = e.target?.result as ArrayBuffer;
      const buffer = new Uint8Array(arrayBuffer);
      const isPdf = buffer[0] === 0x25 && buffer[1] === 0x50 && buffer[2] === 0x44 && buffer[3] === 0x46;
      const isZip = buffer[0] === 0x50 && buffer[1] === 0x4B;
      const sample = new TextDecoder("utf-8").decode(buffer.slice(0, 100));
      const readableRatio = sample.replace(/[^\x20-\x7E]/g, "").length / sample.length;
      const isText = readableRatio > 0.7;
      try {
        if (isPdf) {
          setDocxBuffer(null);
          setDatText(null);
        } else if (isZip || ext === "doc" || ext === "docx") {
          setDatText(null);
          setDocxBuffer(arrayBuffer);
        } else if (isText || ext === "txt") {
          setDocxBuffer(null);
          setDatText(new TextDecoder("utf-8").decode(buffer));
        } else {
          setDocxBuffer(null);
          setDatText("Unsupported format.");
        }
      } catch (err) {
        console.error("Preview error:", err);
        setDocxBuffer(null);
        setDatText("Failed to render document preview.");
      } finally {
        setConverting(false);
      }
    };
    reader.readAsArrayBuffer(file);
  }, [file]);

  useEffect(() => {
    if (!docxBuffer || !docxContainerRef.current) {
      if (docxContainerRef.current) {
        docxContainerRef.current.innerHTML = "";
      }
      return;
    }

    const container = docxContainerRef.current;
    container.innerHTML = "";
    setDocxScale(1);
    setDocxSize({ width: 0, height: 0 });

    renderAsync(docxBuffer, container, undefined, {
      className: "resume-docx",
      inWrapper: true,
      breakPages: true,
      ignoreLastRenderedPageBreak: false,
      renderHeaders: true,
      renderFooters: true,
      renderFootnotes: true,
      renderEndnotes: true,
      useBase64URL: true,
    }).catch((err) => {
      console.error("DOCX preview render failed:", err);
      container.innerHTML = `
      <div class="p-6 text-sm text-red-700 leading-relaxed">
        <p class="mt-1">
          The document may contain scanned images or unsupported formatting.
          Please upload a text-based PDF, DOCX, or TXT resume.
        </p>
      </div>
    `;
    });

    const measure = () => {
      const shell = docxShellRef.current;
      if (!shell || !container) return;

      const wrapper = container.querySelector(".resume-docx-wrapper") as HTMLElement | null;
      const page = container.querySelector("section.resume-docx") as HTMLElement | null;
      const width = page?.offsetWidth || page?.scrollWidth || wrapper?.scrollWidth || container.scrollWidth || 0;
      const height = wrapper?.scrollHeight || container.scrollHeight || 0;

      if (!width || !height) return;

      setDocxSize({ width, height });
      const availableWidth = Math.max(shell.clientWidth - 16, 0);
      const nextScale = availableWidth > 0 ? Math.min(1, availableWidth / width) : 1;
      setDocxScale(nextScale);
      baseScaleRef.current = nextScale;
    };

    const rafId = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(measure);
    });

    const resizeObserver =
      typeof ResizeObserver !== "undefined" && docxShellRef.current
        ? new ResizeObserver(() => measure())
        : null;

    if (resizeObserver && docxShellRef.current) {
      resizeObserver.observe(docxShellRef.current);
    }

    return () => {
      window.cancelAnimationFrame(rafId);
      resizeObserver?.disconnect();
      container.innerHTML = "";
    };
  }, [docxBuffer]);

  const isDocx = !!docxBuffer;
  const isDat  = !!datText;
  const hasPreviewContent = file && (isDocx || isDat || previewUrl);

  // Combined scale: auto-fit × user zoom
  const combinedScale = docxScale * userZoom;
  const zoomPercent = Math.round(userZoom * 100);

  // ── Zoom toolbar ──
  const ZoomToolbar = () => (
    <div className="flex items-center gap-1 px-2 py-1 bg-gray-50 border border-gray-200 rounded-lg flex-shrink-0">
      <button
        onClick={handleZoomOut}
        disabled={userZoom <= MIN_ZOOM}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200
          text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors text-sm font-bold"
        title="Zoom out"
      >
        −
      </button>

      <button
        onClick={handleZoomReset}
        className="px-1.5 min-w-[44px] h-6 text-[11px] font-semibold text-gray-600
          hover:bg-gray-200 rounded transition-colors text-center"
        title="Reset to fit width"
      >
        {zoomPercent}%
      </button>

      <button
        onClick={handleZoomIn}
        disabled={userZoom >= MAX_ZOOM}
        className="w-6 h-6 flex items-center justify-center rounded hover:bg-gray-200
          text-gray-500 hover:text-gray-700 disabled:opacity-30 disabled:cursor-not-allowed
          transition-colors text-sm font-bold"
        title="Zoom in"
      >
        +
      </button>
    </div>
  );

  return (
    <section className="flex flex-col gap-3 h-full min-h-0 min-w-0">

      {!file ? (
        // ── Drop zone ──────────────────────────────────────────────────
        <div
          onClick={() => {
            setDialogOpen(true);
            fileRef.current?.click();
          }}
          onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragging(false);
            setDialogOpen(false);
            if (e.dataTransfer.files[0]) {
              accept(e.dataTransfer.files[0]);
              if (fileRef.current) fileRef.current.value = "";
            }
          }}
          className={`relative flex-1 flex flex-col items-center justify-center gap-4 rounded-xl
            border-2 border-dashed cursor-pointer transition-all duration-200
            ${dragging
              ? "border-blue-400 bg-blue-50"
              : "border-gray-300 bg-white hover:border-blue-400 hover:bg-blue-50"}`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.doc,.docx,.txt,.dat"
            hidden
            onChange={(e) => {
              setDialogOpen(false);  
              if (e.target.files?.[0]) accept(e.target.files[0]);
            }}
          />

          <div className="w-14 h-14 rounded-xl bg-gray-100 flex items-center justify-center">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"
                stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
              <polyline points="17 8 12 3 7 8" stroke="#3b82f6"
                strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
              <line x1="12" y1="3" x2="12" y2="15"
                stroke="#3b82f6" strokeWidth="2" strokeLinecap="round"/>
            </svg>
          </div>

          <div className="text-center">
            <p className="text-sm font-semibold text-gray-700">Drop file here</p>
            <p className="text-xs text-gray-400 mt-1">or click to browse</p>
            <p className="text-[11px] text-gray-400 mt-2">PDF · DOCX · DOC · TXT · DAT · Max 10MB</p>
          </div>
        </div>

      ) : (
        // ── File uploaded ───────────────────────────────────────────────
        <div className="flex-1 flex flex-col gap-2 min-h-0">

          {/* File info bar + zoom controls */}
          <div className="flex items-center justify-between px-3 py-2 bg-gray-50
            border border-gray-200 rounded-lg flex-shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              <div className="w-7 h-7 rounded-lg bg-blue-100 flex items-center justify-center flex-shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none">
                  <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"
                    fill="#dbeafe" stroke="#3b82f6" strokeWidth="1.5"/>
                  <polyline points="14 2 14 8 20 8" stroke="#3b82f6" strokeWidth="1.5"/>
                </svg>
              </div>
              <div className="min-w-0">
                <p className="text-xs font-semibold text-gray-800 truncate">{file.name}</p>
                <p className="text-[11px] text-gray-400">{(file.size / 1024).toFixed(1)} KB</p>
              </div>
            </div>

            <div className="flex items-center gap-2 flex-shrink-0">
              {/* Zoom toolbar — shown for docx/dat content */}
              {hasPreviewContent && !converting && <ZoomToolbar />}

              {parsed && (
                <div className="flex items-center gap-1.5 px-2.5 py-1
                  bg-emerald-50 border border-emerald-200 rounded-lg">
                  <svg className="w-3 h-3 text-emerald-600" viewBox="0 0 16 16"
                    fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M3 8l4 4 6-6"/>
                  </svg>
                  <span className="text-xs font-semibold text-emerald-600">Parsed</span>
                </div>
              )}
              {processing && (
                <div className="flex items-center gap-1.5 px-2.5 py-1
                  bg-gray-50 border border-gray-200 rounded-lg">
                  <div className="w-3 h-3 border border-gray-400 border-t-transparent
                    rounded-full animate-spin"/>
                  <span className="text-xs text-gray-400">Parsing…</span>
                </div>
              )}
              <button
                onClick={onClear}
                className="w-7 h-7 flex items-center justify-center rounded-lg
                  hover:bg-red-50 text-gray-400 hover:text-red-500
                  border border-gray-200 hover:border-red-200 transition-colors"
                title="Remove file"
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none"
                  stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                  <path d="M18 6L6 18M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div className="flex items-center gap-2 px-3 py-2 bg-red-50 border
              border-red-200 rounded-lg text-red-600 text-xs flex-shrink-0">
              <svg width="13" height="13" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" stroke="#ef4444" strokeWidth="2"/>
                <line x1="12" y1="8" x2="12" y2="12" stroke="#ef4444" strokeWidth="2" strokeLinecap="round"/>
                <circle cx="12" cy="16" r="1" fill="#ef4444"/>
              </svg>
              {error}
            </div>
          )}

          {dialogOpen && (
            <div className="absolute inset-0 z-10 flex flex-col items-center justify-center
              gap-3 rounded-xl bg-white/85 backdrop-blur-[2px] pointer-events-none">
              <div className="relative w-10 h-10">
                <div className="absolute inset-0 rounded-full border-4 border-gray-200" />
                <div className="absolute inset-0 rounded-full border-4
                  border-t-blue-500 animate-spin" />
              </div>
              <p className="text-sm font-semibold text-gray-600">Opening file picker…</p>
              <p className="text-xs text-gray-400">Select a file or press Cancel</p>
            </div>
          )}

          {/* Preview area — zoom-enabled */}
          <div ref={previewZoneRef} className="flex-1 min-h-0 flex flex-col">
            {converting ? (
              <div className="flex-1 flex flex-col items-center justify-center gap-3
                bg-white border border-gray-200 rounded-xl">
                <div className="w-8 h-8 border-2 border-blue-500 border-t-transparent
                  rounded-full animate-spin"/>
                <p className="text-sm text-gray-500">Loading document…</p>
              </div>

            ) : isDocx ? (
              <div
                ref={docxShellRef}
                className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm p-3"
              >
                <div
                  ref={docxContainerRef}
                  className="resume-docx-shell bg-white"
                  style={{
                    transform: `scale(${combinedScale})`,
                    transformOrigin: 'top center',
                    width: docxSize.width ? `${docxSize.width}px` : '100%',
                    margin: '0 auto',
                  }}
                />
              </div>

            ) : isDat && datText ? (
              <div className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm">
                <pre
                  className="p-6 text-gray-700 font-mono whitespace-pre-wrap
                    break-words leading-relaxed"
                  style={{
                    fontSize: `${Math.max(10, 12 * userZoom)}px`,
                  }}
                >
                  {datText}
                </pre>
              </div>

            ) : previewUrl ? (
              <div
                className="flex-1 overflow-auto rounded-xl border border-gray-200 bg-white shadow-sm"
              >
                <iframe
                  src={`${previewUrl}#toolbar=1&navpanes=0&scrollbar=1&view=FitH`}
                  title="Preview"
                  className="border-0"
                  style={{
                    width: `${100 / userZoom}%`,
                    height: `${100 / userZoom}%`,
                    transform: `scale(${userZoom})`,
                    transformOrigin: 'top left',
                  }}
                />
              </div>
            ) : null}
          </div>

        </div>
      )}
    </section>
  );
};

export default ResumePreview;
