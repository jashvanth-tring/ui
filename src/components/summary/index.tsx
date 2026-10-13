import React, { MouseEvent, useEffect, useState } from 'react';
import { useGridApiRef } from '@mui/x-data-grid';
import { useDispatch } from 'react-redux';
import { AppDispatch, useAppSelector } from '../../store';
import { FetchAllClients } from '../../store/action/client.action';
import { FetchAllCandidate } from '../../store/action/candidate.action';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import { fetchAllRounds } from '../../store/action/round.action';
import { StatusData } from '../../store/model';
import { fetchStatus } from '../../store/action/status.action';
// import {
//   fetchGapAnalysisOne,
//   fetchGapAnalysisTwo,
//   fetchGapAnalysisThree,
// } from '../../store/action/gap-analysis.action';
import ReusableDataGrid from '../data-grid';
import { Card, CardContent } from '../ui/card';
import { Button } from '../ui/button';
import { ChevronDownIcon, DownloadIcon, BarChartIcon } from 'lucide-react';
import { RootState } from '../../store/reducers';

interface ResultItem {
  id: number;
  // eslint-disable-next-line
  [key: string]: any;
}

const Summary: React.FC = () => {
  const { status } = useAppSelector((state: RootState) => state?.statusSelector) || {};
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const [isDisabled, setIsDisabled] = useState(false);
  const [results, setResults] = useState<ResultItem[]>([]);
  const [currentAnalysis, setCurrentAnalysis] = useState('Gap analysis-1');
  const apiRef = useGridApiRef();

  const dispatch = useDispatch<AppDispatch>();
  const excludedColumns: string[] = ['createdAt', 'updatedAt', 'updatedBy', 'createdBy'];
  const excludedRowsCondition = (row: ResultItem): boolean => row.someField === 'someValue';
  const staticFields = ['noOfProfileNotScheduled', 'notOffered', 'noOfCandidateNotJoined'];

  const handleExport = async () => {
    setIsDisabled(true);
    setTimeout(() => {
      setIsDisabled(false);
    }, 2000);

    const filename = `${currentAnalysis}-${new Date().toISOString().split('T')[0]}.csv`;

    if (apiRef.current) {
      apiRef.current.exportDataAsCsv({ fileName: filename });
    }
  };

  const toggleDropdown = (e: React.MouseEvent) => {
    e.preventDefault();
    setDropdownOpen(!dropdownOpen);
  };

  const handleAnalysisSelection = async (
    e: MouseEvent<HTMLButtonElement>,
    analysisId: number,
    name: string
  ) => {
    e.preventDefault();
    setDropdownOpen(false);
    setCurrentAnalysis(name);

    try {
      console.log(analysisId);
      // let response;
      // if (analysisId === 1) {
      //   response = await dispatch(fetchGapAnalysisOne()).unwrap();
      // } else if (analysisId === 2) {
      //   response = await dispatch(fetchGapAnalysisTwo()).unwrap();
      // } else {
      //   response = await dispatch(fetchGapAnalysisThree()).unwrap();
      // }
      // setResults(response.data);
    } catch (error) {
      console.error('Error fetching gap analysis:', error);
    }
  };

  const columns =
    results.length > 0
      ? Object.keys(results[0] || {})
          .filter((key) => !excludedColumns.includes(key))
          .map((key) => {
            if (key === 'client') {
              return {
                field: 'client',
                headerName: 'Client',
                width: 200,
                headerClassName: 'custom-header-class',
                cellClassName: 'custom-cell-class',
                // eslint-disable-next-line
                renderCell: (params: { row: { client: { name: any } } }) => {
                  return params.row.client ? params.row.client.name : 'No client';
                },
              };
            }

            const isStaticField = staticFields.includes(key);
            return {
              field: key,
              headerName:
                key.charAt(0).toUpperCase() +
                key
                  .slice(1)
                  .replace(/([A-Z])/g, ' $1')
                  .trim(),
              width: 150,
              headerClassName: isStaticField
                ? 'custom-header-class highlight-static'
                : 'custom-header-class',
              cellClassName: isStaticField
                ? 'custom-cell-class highlight-static'
                : 'custom-cell-class',
            };
          })
      : [];

  const orderedColumns = [columns.find((col) => col?.field === 'client')]
    .filter((col): col is NonNullable<typeof col> => col !== undefined)
    .concat(columns.filter((col) => col.field !== 'client'));

  const rows = results
    .filter((item) => !excludedRowsCondition(item))
    .map((item) => ({
      ...item,
      client: item.client ? { name: item.client.clientName } : { name: ' ' },
      id: item.id === 0 ? 'Total' : item.id,
    }));

  useEffect(() => {
    const startFetch = async () => {
      await dispatch(FetchAllClients());
      await dispatch(FetchAllCandidate());
      await dispatch(fetchAllRequirement());
      await dispatch(fetchAllRounds());
      await dispatch(fetchStatus());

      try {
        // const gapOne = await dispatch(fetchGapAnalysisOne()).unwrap();
        setResults([]);
      } catch (error) {
        console.error('Error fetching initial gap analysis:', error);
      }
    };

    startFetch();
  }, [dispatch]);

  return (
    <main>
      <div className=" ">
        <div className="py-3  border-slate-300 flex justify-between items-center p-3">
          <h1 className="text-xl pt-2 font-semibold flex  items-center px-7">Gap Analysis</h1>

          <div className="flex space-x-3 px-3">
            <div className="relative">
              <Button
                onClick={toggleDropdown}
                className="bg-white text-[#0f2247] hover:bg-gray-100 transition-colors font-medium flex items-center min-w-[12rem]"
              >
                {currentAnalysis}
                <ChevronDownIcon className="ml-2 h-4 w-4" />
              </Button>

              {dropdownOpen && (
                <div className="absolute right-0 mt-1 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    {status.length > 0 &&
                      status.map((item: StatusData) => (
                        <button
                          key={item?.id}
                          className="text-[#0f2247] hover:bg-gray-100 block px-4 py-2 text-sm w-full text-left"
                          onClick={(e) => handleAnalysisSelection(e, item.id, item.statusName)}
                        >
                          {item.statusName}
                        </button>
                      ))}
                  </div>
                </div>
              )}
            </div>

            <Button
              onClick={handleExport}
              disabled={isDisabled}
              className="flex items-center space-x-2  text-[var(--brand)rand)] hover:bg-[var(--brand)] hover:text-white transition-colors"
            >
              <DownloadIcon className="mr-2 h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-grow p-5  overflow-hidden flex flex-col h-screen">
        <Card className="flex-grow rounded-sm flex flex-col overflow-hidden shadow-md border-0">
          <CardContent className="p-0 flex-grow overflow-auto">
            {results.length > 0 ? (
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-auto px-0 py-0">
                  <ReusableDataGrid
                    apiRef={apiRef}
                    rows={rows}
                    columns={orderedColumns}
                    pageSize={10}
                    className="maingridcss"
                    initialState={{
                      scroll: { top: 0, left: 0 },
                    }}
                    getRowClassName={(params: { index: number }) => {
                      if (params.index === rows.length - 1) {
                        return 'last-row-total bg-gray-100 font-medium';
                      }
                      return '';
                    }}
                    sx={{
                      '& .MuiDataGrid-columnHeader': {
                        backgroundColor: '#f8f9fa',
                        color: '#0f2247',
                        fontWeight: 'bold',
                      },
                      '& .highlight-static': {
                        backgroundColor: '#eef2ff',
                      },
                      '& .MuiDataGrid-cell:focus': {
                        outline: 'none',
                      },
                      border: 'none',
                      '& .MuiDataGrid-columnSeparator': {
                        display: 'none',
                      },
                      '& .MuiDataGrid-row:hover': {
                        backgroundColor: '#f8f9fa',
                      },
                    }}
                  />
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                <BarChartIcon className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No analysis results available</p>
                <p className="text-sm text-gray-400 mt-21">
                  Select an analysis type to see results
                </p>
                Z{' '}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Summary;
