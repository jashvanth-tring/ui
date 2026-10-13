// Api Versions
export enum ApiVersions {
  V1 = '/v1',
}

// Authentication
export enum AuthenticationRoutes {
  AUTHENTICATION = '/authentication',
  LOGIN = '/login',
  SILENT_LOGIN = '/silent-login',
  LOGOUT = '/logout',
  FORGOT_PASSWORD = '/forgotPassword',
  REFRESH_TOKEN = '/refresh-token',
  RESET_PASSWORD = '/resetPassword',
  RECOVER_PASSWORD = '/recoverPassword',
  SEND_RESETLINK = '/generatePassword',
}

//Roles
export enum RoleRoutes {
  ROLES = '/roles',
}

// Send Invite
export enum InviteRoutes {
  SEND_INVITE = '/invite',
}

// Users
export enum UserRoutes {
  USERS = '/users',
  USER = '/user',
  INVITE = '/invite',
}

// Clients-Profile
export enum ClientRoutes {
  CLIENT_PROFILE = '/client-Profile',
  CLIENTS = '/client-Profiles',
}

// Clients-Profile
export enum DashboardRoutes {
  DASHBOARD_INFO = '/dashboard-info',
}

// Status
export enum StatusRoutes {
  STATUS = '/status',
  STATUSES = '/statuses',
}

// Status Category
export enum StatusCategoryRoutes {
  STATUS_CATEGORIES = '/status-categories',
  STATUS_CATEGORY = '/status-category',
}

// Position Details

export enum PositionDetailsRoutes {
  POSITION_DETAILS = '/position-details',
  POSITION_DETAIL = '/position-detail',
}

// Requirement Details
export enum RequireDetailsRoutes {
  REQUIREMENTS = '/requirements',
  REQUIREMENT_DETAIL = '/requirment-details',
  REQUIREMENT_DETAILS = '/requirement-details',
  UPLOAD_JD = '/upload',
}


//location
export enum LocationDetailsRoutes {
  LOCATION = '/location',
  LOCATIONS = '/locations',
}

//client-location
export enum ClientLocationRoutes {
  CLIENT_LOCATION = '/client-location',
  CLIENT_LOCATIONS = '/clients-locations',
}

//candidate -profile
export enum CandidateProfileRoutes {
  CANDIDATE_PROFILE = '/candidates-profile',
  CANDIDATE_PROFILES = '/candidates-profiles',
  CANDIDATE_PROFILES_STATUS_UPDATE = '/candidates-profile/status',
  CANDIDATE_PIPELINE = '/candidates-profile',
  CANDIDATE_UPLOAD = '/candidates-profile/upload',
  CANDIDATE_EXPORT = '/candidates-profiles/export', 
}

//Rounds
export enum RoundRoutes {
  ROUND = '/round',
  ROUNDS = '/rounds',
  UPCOMING_INTERVIEWS = '/rounds/upcoming-interviews',
  FEEDBACK_TRACKER = '/rounds/feedback-tracker',
}

//Candiadte with status
export enum CandidateStatusAnalysis {
  CANDIDATE_STATUS = '/candidate-status-analysis',
}

// Candidate–client–requirement pipeline rows (flat list)
export enum CandidateStatusRoutes {
  CANDIDATE_STATUS = '/candidate-status',
  PIPELINE_EXPORT  = '/candidate-status/export',
}

// Email campaigns (superuser)
export enum EmailCampaignRoutes {
  BASE = '/email-campaigns',
}

// Superuser settings (statuses UI uses existing /status APIs; gap mapping uses /settings)
export enum SettingsRoutes {
  BASE = '/settings',
}

//Gap analysis routes
export enum GapAnalysisAnalysis {
  DATA_ANALYTICS = '/data-analytics',
  GAP_ANALYSIS = '/gap-analysis',
  GAP_ANALYSIS_UPDATE = '/gap-analysis/update',
  CLIENT_WISE_DATA = '/client-wise',
  WEEKLY = '/weekly',
  DAILY = '/daily',
  // GAP_ANALYSIS_2 = '',
  // GAP_ANALYSIS_3 = '',
}

export enum DailyTrackerRoutes {
  BASE = '/daily-tracker',
  EXPORT = '/daily-tracker/export',
}

// Holidays
export enum HolidayRoutes {
  HOLIDAYS = '/tringapps-holidays',
  HOLIDAY  = '/tringapps-holidays',
  UPLOAD   = '/tringapps-holidays/upload',
  BY_YEAR  = '/tringapps-holidays/year',
}
export enum CandidateExportRoutes {
  CANDIDATE_EXPORT = '/candidates-profiles/export'
}