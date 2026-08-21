import { App as AntApp } from "antd";
import { cleanup, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { afterEach, describe, expect, test } from "vitest";
import AppsPage from "./AppsPage";

afterEach(() => {
  cleanup();
});

describe("AppsPage", () => {
  test("renders the application center and all configured applications", () => {
    render(
      <MemoryRouter>
        <AntApp>
          <AppsPage />
        </AntApp>
      </MemoryRouter>
    );

    expect(screen.getByRole("heading", { name: "应用中心" })).toBeInTheDocument();
    expect(screen.getByText("选择一个子应用开始工作")).toBeInTheDocument();
    expect(screen.getByText("数据分析")).toBeInTheDocument();
    expect(screen.getByText("权限管理")).toBeInTheDocument();
    expect(screen.getAllByRole("button")).toHaveLength(8);
  });
});
