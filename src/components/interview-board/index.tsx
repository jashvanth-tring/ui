import { useEffect } from 'react';
import { Card, CardContent, Typography, Grid, CircularProgress, Box } from '@mui/material';
import { useAppSelector, useDispatch } from '../../store';
import { RootState } from '../../store/reducers';
import { FetchAllCandidate } from '../../store/action/candidate.action';

interface Candidate {
  id: number;
  candidateName: string;
  candidateStatus: {
    statusName: string;
  };
  date: string; // Assuming date is in ISO format ("2025-04-24T18:30:00.000Z")
}

const stages = [
  'Applied',
  'Screening',
  'Technical Round',
  'HR Round',
  'Offer Extended',
  'Rejected',
];

function InterviewBoard() {
  // Global state
  const { candidates, loading, error } = useAppSelector(
    (state: RootState) => state.candidatesSelector
  ) || { candidates: [], loading: false, error: null };
  const dispatch = useDispatch();

  useEffect(() => {
    const fetchStart = async () => {
      try {
        await dispatch(FetchAllCandidate());
      } catch (err) {
        console.error('Error fetching candidates:', err);
      }
    };
    fetchStart();
  }, [dispatch]);

  if (loading) {
    return <CircularProgress />;
  }

  if (error) {
    return <Typography color="error">There was an error fetching candidates: {error}</Typography>;
  }

  if (!candidates || candidates.length === 0) {
    return <Typography>No candidates available.</Typography>;
  }

  // Sort all candidates by date in ascending order (chronological order)
  const sortedCandidates = candidates
    .slice()
    .sort(
      (a: { date: string | number | Date }, b: { date: string | number | Date }) =>
        new Date(a.date).getTime() - new Date(b.date).getTime()
    );

  return (
    <Box sx={{ width: '100%', overflowX: 'auto' }}>
      <Grid container spacing={2} sx={{ flexDirection: 'column', justifyContent: 'center' }}>
        {/* Timeline header: stages */}
        <Grid container spacing={2} sx={{ marginBottom: 2 }}>
          {stages.map((stage) => (
            <Grid item xs={2} key={stage}>
              <Typography variant="h6" sx={{ textAlign: 'center' }}>
                {stage}
              </Typography>
            </Grid>
          ))}
        </Grid>

        {/* Timeline data: candidates */}
        {sortedCandidates.map((candidate: Candidate) => (
          <Grid container spacing={2} key={candidate.id}>
            {/* Iterate through each stage and map to the respective candidate */}
            {stages.map((stage) => (
              <Grid item xs={2} key={stage}>
                {candidate.candidateStatus?.statusName === stage ? (
                  <Card sx={{ backgroundColor: '#1976d2', color: 'white', marginTop: 1 }}>
                    <CardContent>
                      <Typography>{candidate.candidateName}</Typography>
                      <Typography variant="caption">
                        {new Date(candidate.date).toLocaleString()}
                      </Typography>
                    </CardContent>
                  </Card>
                ) : (
                  <Box sx={{ height: 100, width: '100%' }} />
                )}
              </Grid>
            ))}
          </Grid>
        ))}
      </Grid>
    </Box>
  );
}

export default InterviewBoard;
