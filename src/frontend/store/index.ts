import { configureStore, combineReducers } from "@reduxjs/toolkit";
import authReducer from "./auth.slice";
import tenantReducer from "./tenant.slice";
import subscriptionReducer from "./subscription.slice";

/**
 * Root reducer combining all slices
 */
const rootReducer = combineReducers({
  auth: authReducer,
  tenant: tenantReducer,
  subscription: subscriptionReducer,
});

/**
 * Redux store configuration
 */
export const store = configureStore({
  reducer: rootReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      serializableCheck: {
        ignoredActions: ["persist/PERSIST", "persist/REHYDRATE"],
      },
    }),
  devTools: process.env.NODE_ENV === "development",
});

/**
 * Root state type
 */
export type RootState = ReturnType<typeof rootReducer>;

/**
 * App dispatch type
 */
export type AppDispatch = typeof store.dispatch;

/**
 * Typed hooks
 */
export { useSelector, useDispatch } from "react-redux";
export type { TypedUseSelectorHook } from "react-redux";

/**
 * Create typed hooks for use throughout the app
 */
import { TypedUseSelectorHook, useSelector, useDispatch } from "react-redux";
export const useAppSelector: TypedUseSelectorHook<RootState> = useSelector;
export const useAppDispatch = () => useDispatch<AppDispatch>();
