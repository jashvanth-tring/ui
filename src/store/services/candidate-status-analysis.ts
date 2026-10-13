import { axiosInstance } from '../axiosSetup';
import { ApiVersions, CandidateStatusAnalysis } from '../endpoints';

export const fetchAllCandidateStatusAnalysis = async () => {
  return axiosInstance.get(`${ApiVersions.V1}${CandidateStatusAnalysis.CANDIDATE_STATUS}`);
};
