import { createSlice } from "@reduxjs/toolkit";
import type { User } from "@/lib/types";
import { api } from "./api";

interface AuthState {
  user: User | null;
}

const initialState: AuthState = { user: null };

/** The signed-in user. Filled by login, signup or the /me check on page load; cleared on logout or a 401. */
export const authSlice = createSlice({
  name: "auth",
  initialState,
  reducers: {
    signedOut: (state) => {
      state.user = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addMatcher(api.endpoints.login.matchFulfilled, (state, { payload }) => {
        state.user = payload.user;
      })
      .addMatcher(api.endpoints.signup.matchFulfilled, (state, { payload }) => {
        state.user = payload.user;
      })
      .addMatcher(api.endpoints.me.matchFulfilled, (state, { payload }) => {
        state.user = payload.user;
      })
      .addMatcher(api.endpoints.logout.matchFulfilled, (state) => {
        state.user = null;
      });
  },
});

export const { signedOut } = authSlice.actions;
