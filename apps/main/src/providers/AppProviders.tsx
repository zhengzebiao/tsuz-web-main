import type { PropsWithChildren } from "react";
import { App as AntApp } from "antd";
import { QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter } from "react-router-dom";
import { queryClient } from "./query-client";

export function AppProviders({ children }: PropsWithChildren) {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AntApp>{children}</AntApp>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
