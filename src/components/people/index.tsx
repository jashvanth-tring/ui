import { LayoutContainer } from "../../styles/LayoutContainer";
'use client';

import { useEffect, useRef, useState } from 'react';
import { useDispatch } from 'react-redux';
import { RootState } from '../../store/reducers';
import { AppDispatch, useAppSelector } from '../../store';
import { createCandidateProfile } from '../../store/model/candidate.types';
import { CirclePlus, Edit, Upload, FileText, Trash2 } from 'lucide-react';
import { DataTable } from '../customized-table';
import { Button } from '../../components/ui/button';
import { Input } from '../../components/ui/input';
import CustomizedSnackbars from '../customized-snackbar';
import { useSnackbar } from '../../utils/snackbar-function';
import { archiveCandidateAction, fetchCandidateMappings, UpdateCandidateInd } from '../../store/action/candidate.action';
import { fetchTablePreference } from '../../store/action/table-preference.action';
import ConfirmationDialog from '../confirmation-dialog';
import { Card, CardContent } from '../ui/card';
import { TableContentLoader } from '../table-content-loader';
import EditCandidateForm, { CandidateEditProps } from './edit-people';
import { exportCandidates } from '../../utils/export-configs';
import ResumeParser from '../resume-parser';
import DocumentPreviewDialog from '../documents/DocumentPreviewDialog';
import { useNavigate } from 'react-router-dom';
import { toPascalCase, formatPhoneWithSpace } from '../../utils/name-format';
import axios from 'axios';
import {
  fetchCandidateResumeFile,
  fetchCandidatesPaged,
  uploadCandidateResume,
} from '../../store/services/candidate';
import {
  Tooltip,
  TooltipContent,
  TooltipTrigger,
} from "../../components/ui/tooltip";
import {SearchIcon} from 'lucide-react';
import { ExportCandidatesSP, fetchAllUsersForExport } from '../../store/services/candidate';
import PeopleExportDialog from './peopleExportDialog';

const PAGE_SIZE = 50;
const SEARCH_DEBOUNCE_MS = 300;
const People: React.FC = () => {
  const dispatch = useDispatch<AppDispatch>();
  const { user } = useAppSelector((state: RootState) => state?.authSelector);
  const tablePrefState = useAppSelector((state: RootState) => state?.tablePreference);
  const navigate = useNavigate();
  const preferences = tablePrefState?.preferences || {};
  const [isAddFormOpen, setIsAddFormOpen] = useState(false);
  const [isEditFormOpen, setIsEditFormOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedQ, setDebouncedQ] = useState('');
  const [rows, setRows] = useState<createCandidateProfile[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(false);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [editInline, setEditInline] = useState<CandidateEditProps | null>(null);
  const [previewCandidate, setPreviewCandidate] = useState<{
    id: number;
    candidateName: string;
    fileKey: string | null;
  } | null>(null);
  const [confirmDialogOpen, setConfirmDialogOpen] = useState(false);
  const [archiveTargetId, setArchiveTargetId] = useState<number | null>(null);
  const [archiveTargetName, setArchiveTargetName] = useState('');
  const isAdmin = user?.role?.id === 1;
  const { snackbarState, handleSnackbarClose, showSuccessSnackbar, showErrorSnackbar } =
    useSnackbar();
  const [exportModalOpen, setExportModalOpen] = useState(false);
  const [allUsers, setAllUsers] = useState<{ id: number; firstName: string; lastName: string; officialEmail: string }[]>([]);
  // Defer past StrictMode's mount→unmount→remount so `/user-preferences/candidate` fires once.
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      dispatch(fetchTablePreference('candidate'));
    });
    return () => cancelAnimationFrame(id);
  }, [dispatch]);

  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value);
  };

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQ(searchQuery.trim()), SEARCH_DEBOUNCE_MS);
    return () => clearTimeout(t);
  }, [searchQuery]);

  const tableScrollRef = useRef<HTMLDivElement | null>(null);
  const sentinelRef = useRef<HTMLDivElement | null>(null);

  const loadPage1 = async (q: string, signal?: AbortSignal) => {
    setLoading(true);
    try {
      const res = await fetchCandidatesPaged(1, PAGE_SIZE, q, signal);
      if (signal?.aborted) return;
      const body = res.data as any;
      const data = Array.isArray(body?.data) ? body.data : [];
      setRows(data);
      setTotal(body?.pagination?.total ?? data.length);
      setHasMore(Boolean(body?.pagination?.hasMore));
      setPage(2);
    } catch (err) {
      if (axios.isCancel(err) || (err as { code?: string })?.code === 'ERR_CANCELED') return;
      setRows([]);
      setTotal(0);
      setHasMore(false);
      setPage(1);
      showErrorSnackbar('Failed to load candidates');
    } finally {
      if (!signal?.aborted) setLoading(false);
    }
  };

  useEffect(() => {
    const ac = new AbortController();
    loadPage1(debouncedQ, ac.signal);
    return () => ac.abort();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedQ]);

  const loadingMoreRef = useRef(false);

  const fetchNextPage = async () => {
    if (loadingMoreRef.current || !hasMore) return;
    loadingMoreRef.current = true;
    setLoadingMore(true);
    try {
      const res = await fetchCandidatesPaged(page, PAGE_SIZE, debouncedQ);
      const body = res.data as any;
      const data = Array.isArray(body?.data) ? body.data : [];
      setRows((prev) => [...prev, ...data]);
      setHasMore(Boolean(body?.pagination?.hasMore));
      setTotal((prev) => body?.pagination?.total ?? prev);
      setPage((p) => p + 1);
    } catch {
      // keep existing rows
    } finally {
      loadingMoreRef.current = false;
      setLoadingMore(false);
    }
  };

  useEffect(() => {
    const root = tableScrollRef.current;
    const sentinel = sentinelRef.current;
    if (!root || !sentinel) return;

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0].isIntersecting) fetchNextPage();
      },
      { root, rootMargin: '120px', threshold: 0 },
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [hasMore, page, debouncedQ]);

  const getUserNameByAvailableData = (uploadedBy: any) => {
    if (!uploadedBy) return '-';
    const name = `${uploadedBy.firstName || ''} ${uploadedBy.lastName || ''}`.trim();
    if (name) return name;
    return uploadedBy.officialEmail || '-';
  };

  const uploadedBySortKey = (row: any) => {
    const u = row?.uploadedBy;
    if (!u) return '';
    const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
    if (name) return name.toLowerCase();
    return String(u.officialEmail ?? '').trim().toLowerCase();
  };

  const preferencesData = preferences;

  const columns = [
    {
      accessorKey: 'candidateName',
      header: 'Candidate Name',
      enableHiding: false,
       cell: ({ row }: any) =>
      row.original?.candidateName ? toPascalCase(row.original.candidateName) : '—',
    },
    {
      accessorKey: 'emailId',
      header: 'Email',
      enableHiding: false,
    },
    { accessorKey: 'primaryContact', header: 'Phone Number', meta: { locked: true },
        cell: ({ row }: any) => formatPhoneWithSpace(row.original?.primaryContact), },

    { accessorKey: 'candidateLocation', header: 'Location' , meta: { locked: true },
      cell: ({ row }: any) => row.original?.candidateLocation
      ? row.original.candidateLocation.replace(/[0-9]/g, '-').trim() : '-',},

    { accessorKey: 'source', header: 'Source', meta: { locked: true } ,
     cell: ({ row }: any) => row.original?.source
      ? row.original.source.replace(/[0-9]/g,'-').trim() : '-',
    },
    {
      accessorKey: 'sourceDate',
      header: 'Source Date',
      meta: { locked: true },
      cell: ({ row }: any) =>
        row?.original?.sourceDate
          ? new Date(row.original.sourceDate).toLocaleDateString()
          : '-',
    },
    {
      accessorKey: 'profileSharedDate',
      header: 'Profile Shared Date',
      cell: ({ row }: any) => {
        const date = row?.original?.profileSharedDate;
        const mappingCount = Number(row?.original?.mappingCount ?? 0);

        if (mappingCount > 1) {
          return (
            <span className="text-xs text-blue-600 font-medium">
              {mappingCount} requirements
            </span>
          );
        }
        return date
          ? <span>{new Date(date).toLocaleDateString()}</span>
          : <span className="text-gray-400">-</span>;
      },
    },
    {
      accessorKey: 'relExp',
      header: 'Relevant Exp',
      cell: ({ row }: any) => {
        const val = row.original?.relExp;
        if (!val) return '-';
        return /^\d+(\.\d+)?$/.test(String(val)) ? `${val} yrs` : val;
      },
    },
    {
      accessorKey: 'totalExp',
      header: 'Total Exp',
      cell: ({ row }: any) => {
        const val = row.original?.totalExp;
        if (!val) return '-';
        return /^\d+(\.\d+)?$/.test(String(val)) ? `${val} yrs` : val;
      },
    },
    {
      accessorKey: 'skillSet',
      header: 'Skill Set',
      cell: ({ row }: any) => {
        let skills: string[] = [];
        if (Array.isArray(row.original?.skillSet)) {
          skills = row.original.skillSet;
        } else if (typeof row.original?.skillSet === 'string') {
          skills = row.original.skillSet.split(',').map((s: string) => s.trim()).filter(Boolean);
        }
        
        if (skills.length === 0) return '-';
        
        const displaySkills = skills.slice(0, 3);
        const remaining = skills.length - 3;
        
        return (
          <div className="flex flex-wrap gap-1 items-center max-w-[200px]" title={skills.join('\n')}>
            {displaySkills.map((skill, idx) => (
              <span key={idx} className="bg-slate-100 text-slate-700 text-xs px-2 py-0.5 rounded-md border border-slate-200">
                {skill}
              </span>
            ))}
            {remaining > 0 && (
              <span className="text-xs text-slate-500 font-medium ml-1">
                +{remaining}
              </span>
            )}
          </div>
        );
      },
    },
    { accessorKey: 'currentSalary', header: 'Current Salary' ,
      cell:({row}:any)=>
        row?.original?.currentSalary ? row.original.currentSalary.trim():'-',
    },
    { accessorKey: 'expectedSalary', header: 'Expected Salary' ,
       cell:({row}:any)=>
        row?.original?.expectedSalary ? row.original.expectedSalary.trim():'-',
    },
    { accessorKey: 'noticePeriod', header: 'Notice Period',
       cell:({row}:any)=>
        row?.original?.noticePeriod ? row.original.noticePeriod.trim():'-',
   
     },
    {
      accessorKey: 'remarks',
      header: 'Remarks',
      cell: ({ row, column }: any) => {
        const text = row.original?.remarks || '-';

        return (
          <div
            style={{
              width: column.getSize(), 
            }}
            className="truncate"
            title={text}
          >
            {text}
          </div>
        );
      },
    },
    {
      id: 'assignedTo',
      accessorFn: (row: any) => {
        const u = row?.assignedTo;
        if (!u) return '';
        const name = `${u.firstName ?? ''} ${u.lastName ?? ''}`.trim();
        return name ? name.toLowerCase() : String(u.officialEmail ?? '').toLowerCase();
      },
      header: 'Assigned To',
      cell: ({ row }: any) => getUserNameByAvailableData(row.original?.assignedTo),
    },
    {
      id: 'uploadedBy',
      accessorFn: (row: any) => uploadedBySortKey(row),
      header: 'Uploaded By',
      cell: ({ row }: any) =>
        getUserNameByAvailableData(row.original?.uploadedBy),
    },
    {
      id: 'actions',
      header: 'Actions',
      enableHiding: false,
      cell: ({ row }: any) => {
        const candidate = row.original;
        const hasResume = Boolean(candidate?.resumeS3Key);
        return (
          <div className="flex items-center gap-2">
            {hasResume ? (
              <Tooltip>
                <TooltipTrigger asChild>
                  <FileText
                    className="w-4 h-4 cursor-pointer text-slate-600 hover:scale-110 transition"
                    onClick={async (e) => {
                      e.stopPropagation();
                      setPreviewCandidate({
                        id: candidate.id,
                        candidateName: candidate.candidateName ?? 'Candidate',
                        fileKey: candidate.resumeS3Key ?? null,
                      });
                    }}
                  />
                </TooltipTrigger>
                <TooltipContent>
                  <p>View resume</p>
                </TooltipContent>
              </Tooltip>
            ) : (
              <Tooltip>
                <TooltipTrigger asChild>
                  <label
                    className="cursor-pointer inline-flex"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Upload
                      className="w-4 h-4 text-gray-400 hover:text-blue-500 hover:scale-110 transition cursor-pointer"
                    />
                    <input
                      type="file"
                      accept=".pdf,.doc,.docx"
                      className="hidden"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        e.currentTarget.value = '';
                        if (!file) return;
                        try {
                          const res = await uploadCandidateResume(file);
                          const nextKey = (res.data as any)?.data?.resumeS3Key;
                          if (typeof nextKey === 'string' && nextKey.trim()) {
                            const updateRes = await dispatch(
                              UpdateCandidateInd({
                                id: candidate.id,
                                payload: {
                                  resumeS3Key: nextKey.trim(),
                                  updatedBy: { id: user?.id },
                                },
                              })
                            ).unwrap();
                            if (updateRes?.success) {
                              showSuccessSnackbar('Resume uploaded successfully');
                              setRows((prev) =>
                                prev.map((r) =>
                                  r.id === candidate.id
                                    ? { ...r, resumeS3Key: nextKey.trim() }
                                    : r
                                )
                              );
                            } else {
                              showErrorSnackbar('Failed to save resume');
                            }
                          } else {
                            showErrorSnackbar('Upload completed but no S3 key returned');
                          }
                        } catch {
                          showErrorSnackbar('Failed to upload resume');
                        }
                      }}
                    />
                  </label>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Upload resume</p>
                </TooltipContent>
              </Tooltip>
            )}

            <Tooltip>
            <TooltipTrigger asChild>
            <Edit
              className="w-4 h-4 cursor-pointer text-blue-500 hover:scale-110 transition"
              onClick={async (e) => {
                e.stopPropagation();
                // Fetch existing mappings first
                try {
                  const mappingsRes = await dispatch(fetchCandidateMappings({ id: candidate.id })).unwrap();
                  setEditInline({
                    ...candidate,
                    existingMappings: mappingsRes?.data || [],
                  });
                } catch {
                  // Fallback if fetch fails
                  setEditInline(candidate);
                }
                setIsEditFormOpen(true);
              }}
            />
            </TooltipTrigger>
            <TooltipContent>
              <p>Edit</p>
            </TooltipContent>
             </Tooltip>


             <Tooltip>
              <TooltipTrigger asChild>
            <Trash2
  className="w-4 h-4 cursor-pointer text-red-500 hover:scale-110 transition"
  onClick={(e) => {
    e.stopPropagation();
    setArchiveTargetId(candidate.id);
    setArchiveTargetName(candidate.candidateName);
    setConfirmDialogOpen(true);
  }}
/>
            </TooltipTrigger>
            <TooltipContent>
              <p>Delete</p>
            </TooltipContent>
             </Tooltip>
          </div>
        );
      },
    },
  ];

  const handleArchiveConfirm = async () => {
    if (!archiveTargetId || !user?.id) return;

    try {
      const result = await dispatch(
        archiveCandidateAction({
          id: archiveTargetId,
          updatedBy: { id: user.id },
        }),
      ).unwrap();

      if (result?.success) {
        showSuccessSnackbar(
          result?.message ?? 'Candidate archived successfully',
        );
        loadPage1(debouncedQ);
      } else {
        showErrorSnackbar(result?.message ?? 'Failed to archive candidate');
      }
    } catch {
      showErrorSnackbar('An error occurred while archiving the candidate');
    }

    setConfirmDialogOpen(false);
    setArchiveTargetId(null);
    setArchiveTargetName('');
  };

const handleExport = () => {
  if (isAdmin) {
    (async () => {
      try {
        const res = await fetchAllUsersForExport();
        const body = res.data as any;
        const users = Array.isArray(body?.data) ? body.data : [];
        setAllUsers(users);
        setExportModalOpen(true);
      } catch {
        showErrorSnackbar('Failed to load users');
      }
    })();
  } else {
    // non-admin: direct export without modal
    (async () => {
      try {
        const res = await ExportCandidatesSP(user!.id, undefined, undefined, undefined);
        const body = res.data as any;
        const list = Array.isArray(body?.data) ? body.data : [];
        if (list.length === 0) { showErrorSnackbar('Candidates not found!'); return; }
        exportCandidates(list);
      } catch {
        showErrorSnackbar('Failed to export candidates');
      }
    })();
  }
};

  if (!user) return <div className="p-6">Loading...</div>;

  return (
    <LayoutContainer>
      <main>
      <div className="flex items-center justify-between mb-4">
        <h1 className="text-xl font-semibold text-[var(--brand)]">Candidate Management</h1>

        <div className="flex items-center gap-3">
         
          <div className="relative w-64">
          <SearchIcon className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
          <Input placeholder="Search..." onChange={handleSearchChange} className="pl-9" />
          </div>
          <Button onClick={handleExport} className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white">
            <Upload className="w-4 h-4 mr-1" /> Export
          </Button>

          <Button onClick={() => setIsAddFormOpen(true)} className="bg-[var(--brand)] hover:bg-[var(--brand)] text-white">
            <CirclePlus className="w-4 h-4 mr-1" /> Add
          </Button>
        </div>
      </div>

      <Card className="border border-gray-200 shadow-sm rounded-xl overflow-hidden">
        <CardContent className="p-0">
          <TableContentLoader loading={loading} label="Loading candidates…">
            <DataTable
              columns={columns}
              data={rows}
              tableName="candidate"
              preferences={preferencesData}
              scrollContainerRef={(el) => {
                tableScrollRef.current = el;
              }}
              afterTableContent={
                <div>
                  <div
                    ref={(el) => {
                      sentinelRef.current = el;
                    }}
                    className="h-1"
                  />
                  {loadingMore && (
                    <div className="py-3 text-center text-xs text-slate-500">Loading more…</div>
                  )}
                  {!hasMore && rows.length > 0 && !loading && (
                    <div className="py-3 text-center text-xs text-slate-400">
                      All {total || rows.length} record{(total || rows.length) !== 1 ? 's' : ''}{' '}
                      loaded.
                    </div>
                  )}
                </div>
              }
              defaultVisibility={{
                candidateName: true,
                emailId: true,
                primaryContact: true,
                candidateLocation: true,
                skillSet: true,
                actions: true,
                source: true,
                profileSharedDate: false,
                sourceDate: true,
                relExp: false,
                totalExp: false,
                currentSalary: false,
                expectedSalary: false,
                noticePeriod: false,
                remarks: false,
                clientName: true,
                positionName: true,
                uploadedBy: false,
                assignedTo: true,
              }}
              onRowClick={(row: any) => navigate(`/candidate-profile/${row.id}`)}
            />
          </TableContentLoader>
        </CardContent>
      </Card>

      <ResumeParser
        open={isAddFormOpen}
        onClose={() => {
          setIsAddFormOpen(false);
          loadPage1(debouncedQ);
        }}
      />

      {editInline && (
        <EditCandidateForm
          isOpen={isEditFormOpen}
          onOpenChange={setIsEditFormOpen}
          candidate={editInline}
          user={user}
          onSuccess={(apiResponse) => {
            const updated = apiResponse?.data as createCandidateProfile | undefined;
            const mappings = (apiResponse as { mappings?: any[] })?.mappings;
            const profileSharedDate =
              Array.isArray(mappings)
                ? (mappings.find((m: any) => m?.profileSharedDate)?.profileSharedDate ?? null)
                : null;
            if (!updated?.id) return;
            setRows((prev) =>
              prev.map((row) =>
                row.id === updated.id
                  ? {
                      ...row,
                      ...updated,
                      uploadedBy: updated.uploadedBy ?? row.uploadedBy,
                      // preserve mappingCount from existing row — edit API doesn't return it
                      mappingCount: row.mappingCount,
                      ...(profileSharedDate !== null && { profileSharedDate }),
                    }
                  : row,
              ),
            );
            setEditInline((cur) =>
              cur && cur.id === updated.id
                ? {
                    ...cur,
                    ...updated,
                    existingMappings: Array.isArray(mappings) ? mappings : cur.existingMappings,
                    requirementId: '',
                    candidateStatusId: '',
                  }
                : cur,
            );
          }}
        />
      )}

      <DocumentPreviewDialog
        open={Boolean(previewCandidate)}
        onOpenChange={(open) => {
          if (!open) setPreviewCandidate(null);
        }}
        title={
          previewCandidate
            ? `Resume Preview${previewCandidate.candidateName ? ` · ${toPascalCase(previewCandidate.candidateName)}` : ''}`
            : 'Resume Preview'
        }
        fileKey={previewCandidate?.fileKey}
        fetchDocument={() => {
          if (!previewCandidate) {
            throw new Error('No candidate selected for preview');
          }
          return fetchCandidateResumeFile(previewCandidate.id);
        }}
        showError={showErrorSnackbar}
      />

      <CustomizedSnackbars
        open={snackbarState.open}
        handleClose={handleSnackbarClose}
        message={snackbarState.message}
        severity={snackbarState.severity}
      />

      <ConfirmationDialog
        open={confirmDialogOpen}
        onClose={() => {
          setConfirmDialogOpen(false);
          setArchiveTargetId(null);
          setArchiveTargetName('');
        }}
        onConfirm={handleArchiveConfirm}
        title="Archive Candidate"
        description={`Are you sure you want to archive "${archiveTargetName}"? This candidate will be hidden from the list.`}
      />
      {/* ── Admin Export Modal ─────────────────────────────── */}
      <PeopleExportDialog
        open={exportModalOpen}
        onClose={() => setExportModalOpen(false)}
        allUsers={allUsers}
        currentUserId={user!.id}
        showErrorSnackbar={showErrorSnackbar}
      />
    </main>
    </LayoutContainer>

  );
};

export default People;
