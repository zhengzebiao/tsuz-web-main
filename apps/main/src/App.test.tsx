import { App as AntApp } from "antd";
import { cleanup, render } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, beforeEach, describe, expect, test } from "vitest";
import App from "./App";
import { useAuthStore } from "./stores/auth.store";

beforeEach(() => {
  useAuthStore.setState({
    status: "authenticated",
    user: {
      id: "user-1",
      name: "Demo Admin",
      username: "admin",
      roles: ["admin"],
      permissions: []
    },
    accessToken: "demo-token",
    error: undefined
  });
});

afterEach(() => {
  cleanup();
});

describe("App routes", () => {
  test("renders the micro-app container for the JCC route", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app/jcc"]}>
        <AntApp>
          <App />
        </AntApp>
      </MemoryRouter>
    );

    expect(container.querySelector("#subapp-container")).toBeInTheDocument();
    expect(container.querySelector(".app-shell")).toBeInTheDocument();
  });

  test("renders the same container for nested JCC routes", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app/jcc/lineup"]}>
        <AntApp>
          <App />
        </AntApp>
      </MemoryRouter>
    );

    expect(container.querySelector("#subapp-container")).toBeInTheDocument();
  });

  test("keeps the JCC route behind authentication", () => {
    useAuthStore.setState({ status: "anonymous", user: undefined, accessToken: undefined });

    const { container } = render(
      <MemoryRouter initialEntries={["/app/jcc"]}>
        <AntApp>
          <App />
        </AntApp>
      </MemoryRouter>
    );

    expect(container.querySelector("#subapp-container")).not.toBeInTheDocument();
    expect(container.querySelector("#email")).toBeInTheDocument();
  });
});
