import { cleanup, render, screen } from "@testing-library/react";
import { afterEach, describe, expect, test } from "vitest";
import AppFooter from "./AppFooter";

afterEach(() => {
  cleanup();
});

describe("AppFooter", () => {
  test("renders the ICP and public security registration links", () => {
    render(<AppFooter />);

    const icpLink = screen.getByRole("link", { name: "粤ICP备2026087046号" });
    const publicSecurityLink = screen.getByRole("link", { name: "粤公网安备44011802001573号" });

    expect(icpLink).toHaveAttribute("href", "https://beian.miit.gov.cn/");
    expect(icpLink).toHaveAttribute("target", "_blank");
    expect(icpLink).toHaveAttribute("rel", "noreferrer");
    expect(publicSecurityLink).toHaveAttribute(
      "href",
      "https://beian.mps.gov.cn/#/query/webSearch?code=44011802001573"
    );
    expect(publicSecurityLink).toHaveAttribute("target", "_blank");
    expect(publicSecurityLink).toHaveAttribute("rel", "noreferrer");
  });
});
