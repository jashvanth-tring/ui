import { RootState } from '../store/reducers';

export const getLoggedInUserDetails = (state: RootState) => {
  return state?.authSelector?.user;
};
