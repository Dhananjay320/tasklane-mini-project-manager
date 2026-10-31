"use client";

import { useState } from "react";
import { Provider } from "react-redux";
import { makeStore } from "@/store/store";
import { Toasts } from "./Toasts";

export function Providers({ children }: { children: React.ReactNode }) {
  // One store per browser session (and per request during server rendering).
  const [store] = useState(makeStore);
  return (
    <Provider store={store}>
      {children}
      <Toasts />
    </Provider>
  );
}
