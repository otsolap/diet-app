import { cacheLife } from "next/cache";

const FINELI_ORIGIN = "https://fineli.fi";
const SEARCH_LIMIT = 80;

type FineliTarget =
  | { ok: true; url: URL }
  | { ok: false; status: 400 | 404; error: string };

function endpoint(suffix: string) {
  return new URL(`/fineli/api/v1${suffix}`, FINELI_ORIGIN);
}

export function fineliTarget(path: string[], searchParams: URLSearchParams): FineliTarget {
  if (path.length === 1 && path[0] === "components") {
    return { ok: true, url: endpoint("/components") };
  }

  if (path.length === 1 && path[0] === "foods") {
    const term = searchParams.get("q")?.trim() ?? "";
    if (!term) {
      return { ok: false, status: 400, error: "Enter a search term." };
    }

    if (term.length > SEARCH_LIMIT) {
      return { ok: false, status: 400, error: "Use a shorter search term." };
    }

    const url = endpoint("/foods");
    url.searchParams.set("q", term);
    return { ok: true, url };
  }

  if (path.length === 2 && path[0] === "foods") {
    if (!/^[1-9]\d{0,9}$/.test(path[1] ?? "")) {
      return { ok: false, status: 404, error: "That food id is not valid." };
    }

    return { ok: true, url: endpoint(`/foods/${path[1]}`) };
  }

  return { ok: false, status: 404, error: "That Fineli path is not available." };
}

class FineliUpstreamError extends Error {
  readonly status: number;
  readonly body: string;
  readonly json: boolean;

  constructor(status: number, body: string, json: boolean) {
    super("Fineli did not return food data.");
    this.status = status;
    this.body = body;
    this.json = json;
  }
}

function fineliResponse(status: number, body: string) {
  return new Response(body, {
    status,
    headers: {
      "content-type": "application/json",
      "cache-control": "private, no-store",
    },
  });
}

async function readFineliRecord(href: string) {
  "use cache";
  cacheLife("weeks");

  const response = await fetch(href, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10_000),
    cache: "no-store",
  });
  const type = response.headers.get("content-type") ?? "";
  const json = type.includes("json");
  const body = await response.text();
  if (!response.ok || !json) {
    throw new FineliUpstreamError(response.status, body, json);
  }

  return { status: response.status, body };
}

export async function fetchFineli(url: URL) {
  try {
    const record = await readFineliRecord(url.href);
    return fineliResponse(record.status, record.body);
  } catch (error) {
    if (error instanceof FineliUpstreamError && error.json) {
      return fineliResponse(error.status, error.body);
    }

    return Response.json({ error: "Fineli did not return food data." }, { status: 502 });
  }
}
