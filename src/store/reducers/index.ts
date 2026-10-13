import { Reducer, combineReducers } from '@reduxjs/toolkit';

import authenticationReducer from './authentication.reducer';
import rolesReducer from './roles.reducer';
import dialogStateReducer from './dialog-state.reducer';
import statusReducer from './status.reducer';
import PositionDetailsState from './position-detail.reducer';
import statusCategoriesReducer from './status-category.reducer';
import usersReducer from './users.reducer';
import clientsReducer from './client.reducer';
import locationReducer from './location.reducer.ts';
import roundReducer from './round.reducer';
import clientLocationReducer from './client-location.reducer';
import requirementsReducer from './requirement.reducer';
import candidateReducer from './candidate.reducer';
import candidateStatusAnalysisReducer from './candiadte-status-analysis.reducer.ts';
import gapReducer from './gap-analysis.reducer.ts';
import dashboardReducer from './dashboard.reducer.ts';
import holidayReducer from './holiday.reducer';
// ✅🔥 IMPORT YOUR SLICE (IMPORTANT)
import tablePreferenceReducer from './table-preference.reducer.ts'; // ✅ THIS

const appReducer: Reducer = combineReducers({
  authSelector: authenticationReducer,
  rolesSelector: rolesReducer,
  dialogSelector: dialogStateReducer,
  statusSelector: statusReducer,
  statusCategoriesSelector: statusCategoriesReducer,
  positionDetailsSelector: PositionDetailsState,
  usersSelector: usersReducer,
  clientsSelector: clientsReducer,
  locationsSelector: locationReducer,
  clientLocationSelector: clientLocationReducer,
  requirementsSelector: requirementsReducer,
  candidatesSelector: candidateReducer,
  roundsSelector: roundReducer,
  candidateStatusAnalysisSelector: candidateStatusAnalysisReducer,
  gapSelector: gapReducer,
  dashboardSelector: dashboardReducer,
  holidays: holidayReducer,
  // ✅🔥 FINAL FIX (THIS WAS MISSING)
  tablePreference: tablePreferenceReducer,
});

const rootReducer = (
  state: ReturnType<typeof appReducer> | undefined,
  action: {
    type: string;
    [key: string]: unknown;
  }
) => {
  // ✅ Reset state on logout
  if (action.type === 'authentication/logout/fulfilled') {
    return appReducer(undefined, action);
  }

  return appReducer(state, action);
};

export type RootState = ReturnType<typeof appReducer>;
export default rootReducer;