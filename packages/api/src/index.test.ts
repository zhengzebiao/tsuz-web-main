import { describe, expect, test } from "vitest";
import { ApiError, createApiClient } from "./index";

describe("createApiClient", () => {
  test("builds URLs with query params and parses JSON", async () => {
    const requests: Array<{ input: RequestInfo | URL; init?: RequestInit }> = [];
    const client = createApiClient({
      baseUrl: "https://api.example.test/v1",
      fetcher: async (input, init) => {
        requests.push({ input, init });
        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    await expect(client.get("/users", { query: { page: 2, archived: false } })).resolves.toEqual({ ok: true });
    expect(String(requests[0].input)).toBe("https://api.example.test/v1/users?page=2&archived=false");
    expect(requests[0].init?.method).toBe("GET");
  });

  test("adds bearer tokens and JSON request bodies", async () => {
    let capturedHeaders: Headers | undefined;
    let capturedBody: BodyInit | null | undefined;
    const client = createApiClient({
      baseUrl: "/api",
      getAccessToken: () => "token-1",
      fetcher: async (_input, init) => {
        capturedHeaders = init?.headers as Headers;
        capturedBody = init?.body;
        return new Response(null, { status: 204 });
      }
    });

    await expect(client.post("/items", { name: "Demo" })).resolves.toBeUndefined();
    expect(capturedHeaders?.get("Authorization")).toBe("Bearer token-1");
    expect(capturedHeaders?.get("Content-Type")).toBe("application/json");
    expect(capturedBody).toBe(JSON.stringify({ name: "Demo" }));
  });

  test("calls unauthorized handler and throws ApiError for failed responses", async () => {
    let unauthorized = false;
    const client = createApiClient({
      baseUrl: "/api",
      onUnauthorized: () => {
        unauthorized = true;
      },
      fetcher: async () =>
        new Response(JSON.stringify({ message: "Unauthorized" }), {
          status: 401,
          headers: { "Content-Type": "application/json" }
        })
    });

    await expect(client.get("/private")).rejects.toBeInstanceOf(ApiError);
    expect(unauthorized).toBe(true);
  });

  test("refreshes an expired token and retries the original request once", async () => {
    let accessToken = "expired-token";
    const requests: Array<{ token: string | null; path: string }> = [];
    let refreshCalls = 0;
    const client = createApiClient({
      baseUrl: "/api",
      getAccessToken: () => accessToken,
      refreshAccessToken: async () => {
        refreshCalls += 1;
        accessToken = "fresh-token";
      },
      fetcher: async (input, init) => {
        requests.push({
          token: new Headers(init?.headers).get("Authorization"),
          path: new URL(String(input), "http://tsu.local").pathname
        });

        if (requests.length === 1) {
          return new Response(JSON.stringify({ message: "Expired" }), {
            status: 401,
            headers: { "Content-Type": "application/json" }
          });
        }

        return new Response(JSON.stringify({ ok: true }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    await expect(client.get("/private")).resolves.toEqual({ ok: true });
    expect(refreshCalls).toBe(1);
    expect(requests).toEqual([
      { token: "Bearer expired-token", path: "/api/private" },
      { token: "Bearer fresh-token", path: "/api/private" }
    ]);
  });

  test("shares one refresh request across concurrent unauthorized calls", async () => {
    let accessToken = "expired-token";
    let refreshCalls = 0;
    let requestCalls = 0;
    let resolveRefresh: (() => void) | undefined;
    const refreshStarted = new Promise<void>((resolve) => {
      resolveRefresh = resolve;
    });
    let resolveSecondRequest: (() => void) | undefined;
    const secondRequestStarted = new Promise<void>((resolve) => {
      resolveSecondRequest = resolve;
    });
    const client = createApiClient({
      baseUrl: "/api",
      getAccessToken: () => accessToken,
      refreshAccessToken: () => {
        refreshCalls += 1;
        resolveRefresh?.();
        return new Promise<void>((resolve) => {
          setTimeout(() => {
            accessToken = "fresh-token";
            resolve();
          }, 0);
        });
      },
      fetcher: async (_input, init) => {
        requestCalls += 1;
        const token = new Headers(init?.headers).get("Authorization");

        if (token === "Bearer expired-token") {
          if (requestCalls === 2) {
            resolveSecondRequest?.();
          }
          return new Response(null, { status: 401 });
        }

        return new Response(JSON.stringify({ token }), {
          status: 200,
          headers: { "Content-Type": "application/json" }
        });
      }
    });

    const first = client.get<{ token: string }>("/first");
    await refreshStarted;
    const second = client.get<{ token: string }>("/second");
    await secondRequestStarted;
    const results = await Promise.all([first, second]);

    expect(refreshCalls).toBe(1);
    expect(requestCalls).toBe(4);
    expect(results).toEqual([{ token: "Bearer fresh-token" }, { token: "Bearer fresh-token" }]);
  });

  test("does not refresh again when the retried request remains unauthorized", async () => {
    let refreshCalls = 0;
    let unauthorizedCalls = 0;
    const client = createApiClient({
      baseUrl: "/api",
      getAccessToken: () => "still-invalid",
      refreshAccessToken: () => {
        refreshCalls += 1;
      },
      onUnauthorized: () => {
        unauthorizedCalls += 1;
      },
      fetcher: async () => new Response(null, { status: 401 })
    });

    await expect(client.get("/private")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(1);
    expect(unauthorizedCalls).toBe(1);
  });

  test("does not refresh non-401 responses", async () => {
    let refreshCalls = 0;
    const client = createApiClient({
      baseUrl: "/api",
      refreshAccessToken: () => {
        refreshCalls += 1;
      },
      fetcher: async () => new Response(null, { status: 500 })
    });

    await expect(client.get("/private")).rejects.toBeInstanceOf(ApiError);
    expect(refreshCalls).toBe(0);
  });
});
