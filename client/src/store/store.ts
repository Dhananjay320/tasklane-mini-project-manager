import { configureStore, isRejectedWithValue, type Middleware } from "@reduxjs/toolkit";
import { useDispatch, useSelector } from "react-redux";
import { api } from "./api";
import { authSlice, signedOut } from "./authSlice";
import { uiSlice } from "./uiSlice";

/** Any 401 from a protected endpoint means the session ended: drop the user so the app shows the login page. */
const sessionExpiry: Middleware = (store) => (next) => (action) => {
  if (isRejectedWithValue(action) && (action.payload as { status?: number })?.status === 401) {
    const endpoint = (action.meta as { arg?: { endpointName?: string } })?.arg?.endpointName;
    if (endpoint !== "login") store.dispatch(signedOut());
  }
  return next(action);
};

export const makeStore = () =>
  configureStore({
    reducer: {
      [api.reducerPath]: api.reducer,
      auth: authSlice.reducer,
      ui: uiSlice.reducer,
    },
    middleware: (getDefault) => getDefault().concat(api.middleware, sessionExpiry),
  });

export type AppStore = ReturnType<typeof makeStore>;
export type RootState = ReturnType<AppStore["getState"]>;
export type AppDispatch = AppStore["dispatch"];

export const useAppDispatch = useDispatch.withTypes<AppDispatch>();
export const useAppSelector = useSelector.withTypes<RootState>();
