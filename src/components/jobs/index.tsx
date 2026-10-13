import { useEffect, useState } from 'react';
import { RootState } from '../../store/reducers';
import { AppDispatch, useAppSelector } from '../../store';
import { useDispatch } from 'react-redux';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import { Requirement, RequirementDetails } from '../../store/model/requirement-details.types';
import { Link } from 'react-router-dom';
import { Badge } from '../ui/badge';
import { Button } from '../ui/button';
import { Card, CardContent } from '../ui/card';
import {
  Briefcase,
  ChevronRight,
  ChevronDown,
  Search as SearchIcon,
  Plus as PlusIcon,
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '../ui/dropdown-menu';
import { Input } from '../ui/input';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '../ui/table';

const Jobs: React.FC = () => {
  // Global state
  const { requirements } = useAppSelector((state: RootState) => state?.requirementsSelector);

  // Local state
  const [filteredReq, setFilterReq] = useState<RequirementDetails[]>(requirements);
  const [filterValue, setFilterValue] = useState('Active jobs');
  const [searchQuery, setSearchQuery] = useState('');
  const dispatch = useDispatch<AppDispatch>();

  // Effects
  useEffect(() => {
    const callMain = async () => {
      await dispatch(fetchAllRequirement());
    };
    callMain();
  }, [dispatch]);

  useEffect(() => {
    setFilterReq(requirements);
  }, [requirements]);

  const handleFilterChange = (value: string, displayText: string) => {
    setFilterValue(displayText);

    if (value === 'active') {
      const filterRequirements = requirements.filter(
        (requirement: Requirement) => requirement?.isActive === true
      );
      setFilterReq(filterRequirements);
    } else if (value === 'inactive') {
      const filterRequirements = requirements.filter(
        (requirement: Requirement) => requirement?.isActive === false
      );
      setFilterReq(filterRequirements);
    } else {
      setFilterReq(requirements);
    }
  };

  const dateConvert = (value: string) => {
    const date = new Date(value);
    return new Intl.DateTimeFormat('en-GB', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
    }).format(date);
  };

  // Search functionality
  const handleSearchChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const filteredPositions = filteredReq.filter((requirement: RequirementDetails) => {
    const query = searchQuery.toLowerCase();
    const position = requirement.positionDetails.positionName?.toString().toLowerCase() || '';
    const company = (
      requirement.client?.clientName ??
      requirement.client?.clientProfile?.clientName ??
      ''
    )
      .toString()
      .toLowerCase();

    // Handle skillSet conversion safely
    let skills = '';
    if (Array.isArray(requirement.skillSet)) {
      skills = requirement.skillSet.join(' ').toLowerCase();
    } else if (typeof requirement.skillSet === 'string') {
      skills = requirement.skillSet.toLowerCase();
    }

    return position.includes(query) || company.includes(query) || skills.includes(query);
  });

  return (
    <main>
      <div className="">
        <div className="py-3 border-slate-300 flex justify-between items-center p-3">
          <h1 className="text-xl pt-2 font-semibold flex items-center px-7">
            Job Openings Management
          </h1>

          <div className="flex space-x-3 px-3">
            <div className="relative w-64">
              <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
              <Input
                placeholder="Search jobs..."
                onChange={handleSearchChange}
                className="pl-9 w-full bg-white/90 border-0 focus:ring-2 focus:ring-blue-400 text-black"
              />
            </div>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" className="bg-[var(--brand)] text-white hover:bg-primary-800">
                  {filterValue}
                  <ChevronDown className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-40">
                <DropdownMenuItem
                  onClick={() => handleFilterChange('active', 'Active jobs')}
                  className="cursor-pointer"
                >
                  Active jobs
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange('inactive', 'Inactive jobs')}
                  className="cursor-pointer"
                >
                  Inactive jobs
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={() => handleFilterChange('all', 'All jobs')}
                  className="cursor-pointer"
                >
                  All jobs
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      <div className="flex-grow p-3 overflow-hidden flex flex-col h-screen">
        <Card className="flex-grow rounded-sm flex flex-col overflow-hidden shadow-md border-0">
          <CardContent className="p-0 flex-grow overflow-auto">
            {filteredPositions.length > 0 ? (
              <div className="h-full overflow-hidden">
                <div className="h-full overflow-auto px-6 py-1">
                  <Table>
                    <TableHeader className="sticky top-0 bg-gray-50 z-0">
                      <TableRow className="border-b-2 border-[var(--brand)]/20">
                        <TableHead className="font-semibold text-[var(--brand)] py-1">
                          Position
                        </TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">Company</TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">
                          Posted Date
                        </TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">
                          Experience
                        </TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">Skills</TableHead>
                        <TableHead className="font-semibold text-[var(--brand)] py-1">Status</TableHead>
                        <TableHead className="text-right font-semibold text-[var(--brand)] py-1">
                          Actions
                        </TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredPositions.map((requirement: RequirementDetails) => {
                        let skillsArray: string[] = [];
                        if (Array.isArray(requirement.skillSet)) {
                          skillsArray = requirement.skillSet;
                        } else if (typeof requirement.skillSet === 'string') {
                          skillsArray = requirement.skillSet.split(',');
                        }

                        return (
                          <TableRow
                            key={requirement.id}
                            className="hover:bg-gray-50 border-b border-gray-100"
                          >
                            <TableCell className="font-medium py-1">
                              {requirement.positionDetails.positionName || 'Position'}
                            </TableCell>
                            <TableCell className="py-1">
                              {requirement.client?.clientName ||
                                requirement.client?.clientProfile?.clientName ||
                                'Client'}
                            </TableCell>
                            <TableCell className="py-1">
                              {dateConvert(requirement.createdAt)}
                            </TableCell>
                            <TableCell className="py-1">
                              {requirement.relExp === null ? '0' : requirement.relExp} yrs
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="flex flex-wrap gap-1">
                                {skillsArray.slice(0, 2).map((skill: string, i: number) => (
                                  <Badge
                                    key={i}
                                    variant="secondary"
                                    className="text-[0.7rem] px-1.5 py-0"
                                  >
                                    {skill.trim()}
                                  </Badge>
                                ))}
                                {skillsArray.length > 2 && (
                                  <Badge variant="secondary" className="text-[0.7rem] px-1.5 py-0">
                                    +{skillsArray.length - 2}
                                  </Badge>
                                )}
                              </div>
                            </TableCell>
                            <TableCell className="py-1">
                              <div className="flex items-center">
                                <span
                                  className={`text-xs font-medium ${requirement.isActive ? 'text-green-600' : 'text-red-600'}`}
                                >
                                  {requirement.isActive ? 'Active' : 'Inactive'}
                                </span>
                              </div>
                            </TableCell>
                            <TableCell className="text-right py-1">
                              <Button
                                asChild
                                variant="ghost"
                                size="sm"
                                className="h-8 px-2 text-blue-500 hover:text-blue-600 hover:bg-blue-50"
                              >
                                <Link to={`/jobs/job-detail/${requirement.id}`}>
                                  View
                                  <ChevronRight className="ml-1 h-3 w-3" />
                                </Link>
                              </Button>
                            </TableCell>
                          </TableRow>
                        );
                      })}
                    </TableBody>
                  </Table>
                </div>
              </div>
            ) : (
              <div className="flex flex-col justify-center items-center h-full text-gray-500 p-8">
                <Briefcase className="h-16 w-16 text-gray-300 mb-4" />
                <p className="text-lg">No jobs found</p>
                <p className="text-sm text-gray-400 mt-2">
                  Try changing your search or filter criteria
                </p>
                <Button className="mt-4 bg-[var(--brand)] text-white hover:bg-[#1e3a6d]">
                  <PlusIcon className="mr-2 h-4 w-4" />
                  Add Job
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </main>
  );
};

export default Jobs;
