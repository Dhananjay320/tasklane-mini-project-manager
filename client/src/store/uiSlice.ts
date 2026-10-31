import { createSlice, nanoid, type PayloadAction } from "@reduxjs/toolkit";

export interface Toast {
  id: string;
  kind: "success" | "error";
  message: string;
}

export const uiSlice = createSlice({
  name: "ui",
  initialState: { toasts: [] as Toast[] },
  reducers: {
    toastShown: {
      reducer: (state, action: PayloadAction<Toast>) => {
        // Keep at most 3 on screen.
        state.toasts = [...state.toasts.slice(-2), action.payload];
      },
      prepare: (kind: Toast["kind"], message: string) => ({ payload: { id: nanoid(), kind, message } }),
    },
    toastDismissed: (state, action: PayloadAction<string>) => {
      state.toasts = state.toasts.filter((t) => t.id !== action.payload);
    },
  },
});

export const { toastShown, toastDismissed } = uiSlice.actions;
