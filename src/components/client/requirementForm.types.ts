export interface RequirementFormData {
  noOfPositions:      string;
  skill:              string[];
  experience:         string;
  client_id:          string;
  position_detail_id: string;
  position:           string;
  startDate:          string;
  endDate:            string;
  status:             string;
  remarks:            string;
  salaryBudget:       string;
  approvedBy:         string;
  reportingManager:   string;
  accountManager:     string;
  roleType:           string;
  modeOfWork:         string;
  modeOfInterview:    string;
  priority: string;
  jobRequirementForm: string;
  positionType: string;
}

export interface RequirementFormErrors {
  noOfPositions:      string;
  skill:              string;
  experience:         string;
  client_id:          string;
  position_detail_id: string;
  position:           string;
  startDate:          string;
  endDate:            string;
  status:             string;
  remarks:            string;
  salaryBudget:       string;
  approvedBy:         string;
  reportingManager:   string;
  accountManager:     string;
  roleType:           string;
  modeOfWork:         string;
  modeOfInterview:    string;
  jobRequirementForm: string;
  priority: string;
  positionType: string;
}

export const EMPTY_REQUIREMENT_ERRORS: RequirementFormErrors = {
  noOfPositions:      '',
  skill:              '',
  experience:         '',
  client_id:          '',
  position_detail_id: '',
  position:           '',
  startDate:          '',
  endDate:            '',
  status:             '',
  remarks:            '',
  salaryBudget:       '',
  approvedBy:         '',
  reportingManager:   '',
  accountManager:     '',
  roleType:           '',
  modeOfWork:         '',
  modeOfInterview:    '',
  priority: '',
  jobRequirementForm: '',
  positionType: '',
};