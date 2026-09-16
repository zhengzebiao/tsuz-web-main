import { App as AntApp } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { MemoryRouter, useLocation } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import AppsPage from "./AppsPage";

afterEach(() => {
  cleanup();
});

function LocationProbe() {
  return <output data-testid="location">{useLocation().pathname}</output>;
}

describe("AppsPage", () => {
  test("renders the configured application and navigates to it", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <AntApp>
          <AppsPage />
          <LocationProbe />
        </AntApp>
      </MemoryRouter>
    );

    expect(screen.queryByRole("heading", { name: "应用中心" })).not.toBeInTheDocument();
    expect(screen.queryByText("选择一个子应用开始工作")).not.toBeInTheDocument();
    expect(screen.getByText("金铲铲")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(1);

    await user.click(screen.getByRole("button"));
    expect(screen.getByTestId("location")).toHaveTextContent("/app/jcc");
  });

  test("supports keyboard navigation to the configured application", async () => {
    const user = userEvent.setup();

    render(
      <MemoryRouter initialEntries={["/apps"]}>
        <AntApp>
          <AppsPage />
          <LocationProbe />
        </AntApp>
      </MemoryRouter>
    );

    screen.getByRole("button").focus();
    await user.keyboard("{Enter}");
    expect(screen.getByTestId("location")).toHaveTextContent("/app/jcc");
  });
});
