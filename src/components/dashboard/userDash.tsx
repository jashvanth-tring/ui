import { useState, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { RootState } from '../../store/reducers';
import { Link } from 'react-router-dom';
import { RequirementDetails } from '../../store/model/requirement-details.types';
import { fetchAllRequirement } from '../../store/action/requirement-details.action';
import { AppDispatch } from '../../store';
import { fetchStatus } from '../../store/action/status.action';
import { FetchAllCandidate } from '../../store/action/candidate.action';
import { candidateProfileDetails, createCandidateProfile } from '../../store/model/candidate.types';
import { fetchAllRounds } from '../../store/action/round.action';
import { Briefcase, LaptopMinimalCheck, PersonStanding } from 'lucide-react';
import { fetchDashboardTable } from '../../store/action/dashboard.action';
import { dashboardTable } from '../../store/model/dashboard.types';

export default function DashboardUser() {
  // Global state
  const { requirements } = useSelector((state: RootState) => state?.requirementsSelector);
  const { candidates } = useSelector((state: RootState) => state?.candidatesSelector);
  const { user } = useSelector((state: RootState) => state?.authSelector);
  const { dashboard } = useSelector((state: RootState) => state?.dashboardSelector);

  // Local state
  const [currentDate, setCurrentDate] = useState<string>('');
  const [searchTerm, setSearchTerm] = useState('');
  const [dropdownVisible, setDropdownVisible] = useState<{ [key: number]: boolean }>({});
  const dispatch = useDispatch<AppDispatch>();

  // Filtering candidates by matching user ID
  const filteredCandidatesByUser = candidates.filter(
    (candidate: createCandidateProfile) => candidate.createdBy.id === user.id
  );

  // Filtering candidates by search term
  const filteredCandidates = filteredCandidatesByUser.filter(
    (candidate: createCandidateProfile) => {
      const candidateName = candidate.candidateName.toLowerCase();
      return candidateName.includes(searchTerm.toLowerCase());
    }
  );

  useEffect(() => {
    const fetchCate = async () => {
      await dispatch(fetchStatus());
      await dispatch(fetchDashboardTable());
    };
    fetchCate();
  }, [requirements]);

  useEffect(() => {
    const getCurrentDate = () => {
      const today = new Date();
      const dayOfWeek = today.toLocaleString('en-us', { weekday: 'long' });
      const date = today.toLocaleDateString();
      return `${dayOfWeek}, ${date}`;
    };
    setCurrentDate(getCurrentDate());
    const fetchDetails = async () => {
      await dispatch(fetchAllRequirement());
      await dispatch(FetchAllCandidate());
      await dispatch(fetchAllRounds());
    };
    fetchDetails();
  }, []);

  const handleToggleDropdown = (id: number) => {
    setDropdownVisible((prevState) => ({
      ...prevState,
      [id]: !prevState[id],
    }));
  };

  return (
    <div className="dashboard">
      <div className="dashhed">
        <div className="dashhed1 ">
          <h4>Hello 👋,{user.firstName}</h4>
          <span>Today is {currentDate}</span>
        </div>
        <div className="dashhed2">
          <div className="dashhed21 shadow-md">
            <div className="dashhedsearch">
              <h4 className="spoyyer">Candidates</h4>
              <div className="roundsearch">
                {/* Search input field */}
                <input
                  type="text"
                  placeholder="Search by name"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)} // Handle change of search term
                />
              </div>
            </div>
            <div className="dashbody">
              <div className="dashbody1">
                <div className="dashtable">
                  <div className="tablehed">
                    <div className="tablehedcell">Candidate name</div>
                    <div className="tablehedcell">job title</div>
                    <div className="tablehedcell">client</div>
                    <div className="tablehedcell">source</div>
                    <div className="tablehedcell">status</div>
                    <div className="tablehedcell flex-0">c</div>
                  </div>
                  {filteredCandidates &&
                    filteredCandidates.map((candidate: candidateProfileDetails) => {
                      const candreq = requirements.find(
                        (req: RequirementDetails) => req.id 
                      );
                      return (
                        <div className="tablebofy" key={candidate.id}>
                          <div className="tablebodycell">{candidate.candidateName ?? ''}</div>
                          <div className="tablebodycell">
                            {candreq?.positionDetails.positionName ?? ''}
                          </div>
                          <div className="tablebodycell">{candreq?.client.clientName ?? ''}</div>
                          <div className="tablebodycell">{candidate?.source ?? ''}</div>
                          <div className="tablebodycell control">
                            <ul className="ottabdropfoor">
                              <li>
                                <button
                                  onClick={() =>
                                    candidate.id !== null && handleToggleDropdown(candidate.id)
                                  }
                                >
                                  ...
                                </button>
                                {candidate.id !== null && dropdownVisible[candidate.id] && (
                                  <ul className="intabdropfoor">
                                    <li>
                                      <Link
                                        to={`/candidates/candidate-detail/${candidate.id}`}
                                        className="view-profile-link"
                                      >
                                        View Profile
                                      </Link>
                                    </li>
                                    {/* <li>
                                                                            <button>Delete Profile</button>
                                                                        </li> */}
                                  </ul>
                                )}
                              </li>
                            </ul>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
          <div className="dashhed22 mt-2 shadow-md ">
            <div className="dashbody2">
              <div className="dashbody21 spoyyer">
                <h4>Recruitment</h4>
              </div>
              {/* data for round  */}
              <div className="requierecont">
                <div className="requiereflx">
                  {dashboard.length > 0 &&
                    dashboard.map((dashboard: dashboardTable) => {
                      return (
                        <div className="reqflcrd">
                          <div className="reqflcrd1">
                            <div className="reqflctxt">
                              <h5>{dashboard.role}</h5>
                            </div>
                            <div className="reqflcmem">
                              <div className="categoryys">
                                {' '}
                                <LaptopMinimalCheck />
                                design
                              </div>
                              <div className="candidatecou">
                                {' '}
                                <PersonStanding />
                                {dashboard.available} slot
                              </div>
                              <div className="interbiewd">
                                <Briefcase /> {dashboard.test} interviewed
                              </div>
                            </div>
                          </div>
                          <div className="reqflcrd2">
                            <Link to={'/jobs'}>
                              <div className="reqflx2btn">
                                <button>open</button>
                              </div>
                            </Link>
                          </div>
                        </div>
                      );
                    })}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
