export const runtime = "nodejs";
export const dynamic = "force-dynamic";

import { Agent } from "undici";

const BASE = (process.env.PS365_API_BASE || "").replace(/\/$/, "");
const TOKEN = process.env.PS365_TOKEN || "";

// dev-only: allow broken TLS from the test host
const dispatcher =
  process.env.PS365_ALLOW_INSECURE === "true"
    ? new Agent({ connect: { rejectUnauthorized: false } })
    : undefined;

// ✅ Make this async and await params
async function upstreamURL(req, params) {
  const resolvedParams = await params;
  const path = Array.isArray(resolvedParams?.path)
    ? resolvedParams.path.join("/")
    : "";
  const { search } = new URL(req.url);
  return `${BASE}/${path}${search || ""}`;
}

async function proxyPOST(req, ctx) {
  let bodyObj = {};
  try {
    bodyObj = await req.json();
  } catch {}
  if (!bodyObj.api_credentials) bodyObj.api_credentials = { token: TOKEN };

  const url = await upstreamURL(req, ctx.params); // ✅ await
  const res = await fetch(url, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(bodyObj),
    dispatcher,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

async function proxyGET(req, ctx) {
  const url = await upstreamURL(req, ctx.params); // ✅ await
  const res = await fetch(url, {
    method: "GET",
    headers: { "content-type": "application/json", token: TOKEN },
    dispatcher,
  });

  const text = await res.text();
  return new Response(text, {
    status: res.status,
    headers: {
      "content-type": res.headers.get("content-type") || "application/json",
    },
  });
}

export async function GET(req, ctx) {
  return proxyGET(req, ctx);
}

export async function POST(req, ctx) {
  return proxyPOST(req, ctx);
}

export async function PUT(req, ctx) {
  return proxyPOST(req, ctx);
}

export async function PATCH(req, ctx) {
  return proxyPOST(req, ctx);
}

export async function DELETE(req, ctx) {
  return proxyPOST(req, ctx);
}
