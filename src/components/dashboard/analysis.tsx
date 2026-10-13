import { useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from '../../components/ui/card';
import { StatusData } from '../../store/model';
import { createCandidateProfile } from '../../store/model/candidate.types';

export default function CandidateStatusSummary() {
  const { candidates } = useSelector((state: RootState) => state?.candidatesSelector);
  const { status } = useSelector((state: RootState) => state?.statusSelector);

  const themeColor = 'var(--brand)';
  const primaryColor = '#6366f1';
  const secondaryColor = '#8b5cf6';
  const tertiaryColor = '#0ea5e9';

  const filterCandidate = (value: number) => {
    return candidates.filter(
      (candidate: createCandidateProfile) => candidate.candidateStatus.id === value
    );
  };

  return (
    <Card className="shadow-md border border-gray-100" style={{ borderRadius: '12px' }}>
      <CardHeader className="pb-2 border-b border-gray-100">
        <CardTitle style={{ color: themeColor }}>Candidate Status Summary</CardTitle>
        <CardDescription>Overview of candidates by status category</CardDescription>
      </CardHeader>
      <CardContent className="p-2">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {status && Array.isArray(status) ? (
            status.map((statusData: StatusData, index: number) => {
              const filteredCandidates = filterCandidate(statusData.id);
              return (
                <Card
                  key={index}
                  className="bg-white border border-gray-100 shadow-md hover:shadow-lg transition-shadow duration-200"
                  style={{ borderRadius: '8px' }}
                >
                  <CardContent className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h3 className="font-medium" style={{ color: themeColor }}>
                        {statusData.statusName}
                      </h3>
                      <div
                        className="h-3 w-3 rounded-full"
                        style={{
                          backgroundColor:
                            index % 3 === 0
                              ? primaryColor
                              : index % 3 === 1
                                ? secondaryColor
                                : tertiaryColor,
                        }}
                      ></div>
                    </div>
                    <p
                      className="text-2xl font-bold"
                      style={{
                        color:
                          index % 3 === 0
                            ? primaryColor
                            : index % 3 === 1
                              ? secondaryColor
                              : tertiaryColor,
                      }}
                    >
                      {filteredCandidates.length || 0}
                    </p>
                    <p className="text-xs text-gray-500 mt-1">Total candidates</p>
                  </CardContent>
                </Card>
              );
            })
          ) : (
            <div className="col-span-full text-center py-4 text-gray-500">
              No status data available
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
