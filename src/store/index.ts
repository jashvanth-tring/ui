import { configureStore, ThunkAction, Action } from '@reduxjs/toolkit';
import {
  useDispatch as useReduxDispatch,
  useSelector as useReduxSelector,
  TypedUseSelectorHook,
} from 'react-redux';

import rootReducer, { RootState } from './reducers';

const store = configureStore({
  reducer: rootReducer,

  // ✅ DevTools only in development
  devTools: process.env.NODE_ENV !== 'production',

  // ✅ Keep middleware clean
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        // optional: ignore only specific paths if needed
        ignoredActions: [],
        ignoredPaths: [],
      },
    }),
});

// ✅ Types
export type AppDispatch = typeof store.dispatch;

export type AppThunk<ReturnType = void> = ThunkAction<
  ReturnType,
  RootState,
  unknown,
  Action<string>
>;

// ✅ Hooks
export const useDispatch = () => useReduxDispatch<AppDispatch>();

export const useAppSelector: TypedUseSelectorHook<RootState> =
  useReduxSelector;

export default store;