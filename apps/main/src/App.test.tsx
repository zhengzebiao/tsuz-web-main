import { App as AntApp } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter, useLocation } from "react-router-dom";
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

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("App routes", () => {
  test("redirects the admin root route to the users page", () => {
    const { container } = render(
      <MemoryRouter initialEntries={["/app/admin"]}>
        <AntApp>
          <App />
          <LocationProbe />
        </AntApp>
      </MemoryRouter>
    );

    expect(screen.getByTestId("location")).toHaveTextContent("/app/admin/users");
    expect(container.querySelector("#subapp-container")).toBeInTheDocument();
  });

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
