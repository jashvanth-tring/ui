import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { useDispatch, useAppSelector } from '../../store';
import { RootState } from '../../store/reducers';
import {
  getCandidateById,
  fetchCandidateStatusHistory,
  fetchCandidateProfileHistory,
  fetchCandidateMappings,
} from '../../store/action/candidate.action';
import CandidateHeaderCard from '../../components/candidateHeaderCard';
import CandidateHistoryPanel from '../../components/candidateApplicationHistory/index';
import Navbar from '../../components/navbar';
import Loader from '../../components/loader';

const CandidateProfile: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const location = useLocation();
  const [candidateMappings, setCandidateMappings] = useState<any[]>([]);

  const {
    currentCandidate,
    loading,
    statusHistory,
    statusHistoryLoading,
    statusHistoryHasMore,
    statusHistoryNextCursor,
    profileHistory,
    profileHistoryLoading,
    profileHistoryHasMore,
    profileHistoryNextCursor,
  } = useAppSelector((state: RootState) => state.candidatesSelector);

  const numId = id ? Number(id) : null;

  const focusedRequirementId = useMemo(() => {
    const sp = new URLSearchParams(location.search);
    const v = sp.get('requirementId');
    if (!v) return null;
    const n = Number(v);
    return Number.isFinite(n) ? n : null;
  }, [location.search]);

  // ── Initial load ────────────────────────────────────────────────────────────
  useEffect(() => {
    if (!numId) return;
    dispatch(getCandidateById({ id: numId }));
    dispatch(fetchCandidateStatusHistory({ id: numId }));
    dispatch(fetchCandidateProfileHistory({ id: numId }));
    dispatch(fetchCandidateMappings({ id: numId }))
      // eslint-disable-next-line @typescript-eslint/no-floating-promises
      .unwrap()
      .then((res: any) => setCandidateMappings(Array.isArray(res?.data) ? res.data : []))
      .catch(() => setCandidateMappings([]));
  }, [numId, dispatch]);

  // ── Infinite scroll callbacks ───────────────────────────────────────────────
  const handleLoadMoreStatus = useCallback(
    (cursor: string | null) => {
      if (!numId || statusHistoryLoading) return;
      dispatch(fetchCandidateStatusHistory({ id: numId, cursor: cursor ?? undefined }));
    },
    [numId, statusHistoryLoading, dispatch]
  );

  const handleLoadMoreProfile = useCallback(
    (cursor: string | null) => {
      if (!numId || profileHistoryLoading) return;
      dispatch(fetchCandidateProfileHistory({ id: numId, cursor: cursor ?? undefined }));
    },
    [numId, profileHistoryLoading, dispatch]
  );

  if (loading && !currentCandidate) return <Loader />;

  return (
    <>
      <Navbar />

      {/* ── Page header: full-width bar, sticky under navbar, left-aligned with nav padding ── */}
      <header className="sticky top-14 z-40 w-full bg-white">
        <div className="mx-auto flex min-h-14 max-w-8xl shrink-0 items-center justify-start gap-1.5 px-4 py-2.5 sm:px-6 sm:py-3 lg:px-8">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-lg text-gray-600 transition-colors hover:bg-gray-100 hover:text-gray-900"
            aria-label="Go back"
          >
            <svg
              className="size-[22px]"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
          </button>
          <h1 className="mb-0 mt-0 text-lg font-bold leading-7 text-gray-900 sm:text-xl sm:leading-7">
            Candidate Overview
          </h1>
        </div>
      </header>

      {/* ── Main content ── */}
      <div className="min-h-screen pb-4 pt-14">
        <div className="mx-auto px-4 sm:px-6 lg:px-8">
          {/* Candidate identity card — minimal gap under sticky header */}
          <div className="mt-0">
            <CandidateHeaderCard
              name={currentCandidate?.candidateName ?? ''}
              location={currentCandidate?.candidateLocation ?? ''}
              phone={currentCandidate?.primaryContact ?? ''}
              email={currentCandidate?.emailId ?? ''}
              skillSet={currentCandidate?.skillSet ?? ''}
              noticePeriod={currentCandidate?.noticePeriod ?? ''}
              totalExp={(currentCandidate?.totalExp as any) ?? 0}
              source={currentCandidate?.source ?? ''}
            />
          </div>

          {/* History panel — fully wired */}
          <CandidateHistoryPanel
            candidateId={numId}
            candidateName={currentCandidate?.candidateName}
            focusedRequirementId={focusedRequirementId}
            candidateMappings={candidateMappings}
            statusHistory={statusHistory}
            statusHistoryLoading={statusHistoryLoading}
            statusHistoryHasMore={statusHistoryHasMore}
            statusHistoryNextCursor={statusHistoryNextCursor}
            profileHistory={profileHistory}
            profileHistoryLoading={profileHistoryLoading}
            profileHistoryHasMore={profileHistoryHasMore}
            profileHistoryNextCursor={profileHistoryNextCursor}
            onLoadMoreStatus={handleLoadMoreStatus}
            onLoadMoreProfile={handleLoadMoreProfile}
            onAfterStatusChange={() => {
              if (!numId) return;
              dispatch(fetchCandidateStatusHistory({ id: numId }));
              dispatch(fetchCandidateMappings({ id: numId }))
                // eslint-disable-next-line @typescript-eslint/no-floating-promises
                .unwrap()
                .then((res: any) => setCandidateMappings(Array.isArray(res?.data) ? res.data : []))
                .catch(() => setCandidateMappings([]));
            }}
          />
        </div>
      </div>
    </>
  );
};

export default CandidateProfile;
