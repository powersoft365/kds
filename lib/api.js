// lib/api.js
// Implements the endpoints from the documentation links, but calls the real API base
// you use in Postman (test.api.powersoft365.com).
//
// Docs for reference (do not call these hosts; they’re just docs):
// - Get all batch orders (POST):  https://doc4api.powersoft365.com/list_stock_batch_invoice
// - Get all batch orders headers: (see your Postman collection -> list_stock_batch_invoice_header)
// - Get by shopping cart code (GET): https://doc4api.powersoft365.com/stock_batch_invoice
// - Bulk change status (POST):      https://doc4api.powersoft365.com/list_stock_batch_invoice_change_status
// - List table settings (POST):     https://doc4api.powersoft365.com/list_table_settings
// - List floor tables (GET):        https://doc4api.powersoft365.com/list_floor_tables

const API_BASE = process.env.NEXT_PUBLIC_PS365_API_BASE;
const TOKEN = process.env.NEXT_PUBLIC_PS365_TOKEN;

function assertEnv() {
  if (!API_BASE) throw new Error("NEXT_PUBLIC_PS365_API_BASE is not set");
  if (!TOKEN) throw new Error("NEXT_PUBLIC_PS365_TOKEN is not set");
}

async function postJson(path, body) {
  assertEnv();
  const res = await fetch(`${API_BASE}${path}`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      api_credentials: { token: TOKEN }, // as in Postman
      ...(body || {}),
    }),
  });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`POST ${path} failed: ${res.status}`);
  return json;
}

async function getJson(path, query = {}) {
  assertEnv();
  const url = new URL(`${API_BASE}${path}`);
  url.searchParams.set("token", TOKEN); // as in Postman for GET
  Object.entries(query).forEach(([k, v]) => {
    if (v !== undefined && v !== null && v !== "")
      url.searchParams.set(k, String(v));
  });
  const res = await fetch(url.toString(), { method: "GET" });
  const text = await res.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    json = { raw: text };
  }
  if (!res.ok) throw new Error(`GET ${path} failed: ${res.status}`);
  return json;
}

/* ===================== ORDERS (Batch Invoices) ===================== */

// docs: POST /list_stock_batch_invoice
export async function listBatchOrders({
  pageNumber = 1,
  pageSize = 50,
  onlyCounted = "N",
  itemDepartmentSelection = "",
  invoiceType = "all",
  invoiceSystemStatus = "all",
  extraFilters = {},
} = {}) {
  return postJson("/list_stock_batch_invoice", {
    filter_define: {
      page_number: pageNumber,
      page_size: pageSize,
      only_counted: onlyCounted, // "Y": count only, "N": data
      invoice_type: invoiceType, // "all"
      invoice_system_status: invoiceSystemStatus, // "all"
      item_department_selection: itemDepartmentSelection, // "BAR" or "BAR,KITCHEN"
      sorting_by: "ValueDateTime",
      sorting_type: "descending",
      ...extraFilters, // map your *_selection fields here if needed
    },
  });
}

// docs: “headers” variant (see your Postman collection name)
// Some tenants expose /list_stock_batch_invoice_header
export async function listBatchOrderHeaders({
  pageNumber = 1,
  pageSize = 50,
  onlyCounted = "N",
  extraFilters = {},
} = {}) {
  return postJson("/list_stock_batch_invoice_header", {
    filter_define: {
      page_number: pageNumber,
      page_size: pageSize,
      only_counted: onlyCounted,
      invoice_type: "all",
      invoice_system_status: "all",
      sorting_by: "ValueDateTime",
      sorting_type: "descending",
      ...extraFilters,
    },
  });
}

// docs: GET /stock_batch_invoice (by shopping cart code, by 365 code, etc.)
export async function getBatchOrderByShoppingCart({
  shopping_cart_code,
  by_365_code = false,
  batch_invoice_code,
  table_id,
  store_code_365,
  station_code_365,
} = {}) {
  const query = {};
  if (shopping_cart_code) query.shopping_cart_code = shopping_cart_code;
  if (by_365_code != null) query.by_365_code = by_365_code ? "true" : "false";
  if (batch_invoice_code) query.batch_invoice_code = batch_invoice_code;
  if (table_id) query.table_id = table_id;
  if (store_code_365) query.store_code_365 = store_code_365;
  if (station_code_365) query.station_code_365 = station_code_365;
  return getJson("/stock_batch_invoice", query);
}

// docs: POST /list_stock_batch_invoice_change_status
export async function bulkChangeBatchOrderStatus(rows = []) {
  // rows: [{ batch_invoice_number_365, line_id_365:"", status_code_365, item_department_code_365:"", time_to_complete:0 }]
  if (!Array.isArray(rows) || rows.length === 0) {
    throw new Error("bulkChangeBatchOrderStatus: provide a non-empty array");
  }
  return postJson("/list_stock_batch_invoice_change_status", {
    list_stock_batch_invoice: rows,
  });
}

/* ===================== TABLES ===================== */

// docs: POST /list_table_settings
export async function listTableSettings({
  pageNumber = 1,
  pageSize = 50,
  onlyCounted = "N",
  store_selection = "",
  station_selection = "",
} = {}) {
  return postJson("/list_table_settings", {
    filter_define: {
      page_number: pageNumber,
      page_size: pageSize,
      only_counted: onlyCounted,
      store_selection,
      station_selection,
    },
  });
}

// docs: GET /list_floor_tables
export async function listFloorTables({
  station_code_365,
  agent_code_365,
  store_code_365,
} = {}) {
  return getJson("/list_floor_tables", {
    station_code_365,
    agent_code_365,
    store_code_365,
  });
}

/* ===================== SAFE READ HELPERS ===================== */

// Count: your console showed total_count_list_invoices.
// We first check generic keys, then any "total_count_*" key on the payload.
export function readTotalCount(payload) {
  if (!payload || typeof payload !== "object") return 0;
  const generic =
    payload?.api_response?.total_count ??
    payload?.total_count ??
    payload?.count ??
    payload?.total;
  if (Number.isFinite(generic)) return Number(generic);
  for (const k of Object.keys(payload)) {
    if (k.startsWith("total_count") && Number.isFinite(Number(payload[k]))) {
      return Number(payload[k]);
    }
  }
  return 0;
}

// List: prefer list_invoices (seen in your console); keep fallbacks.
export function readOrdersList(payload) {
  if (!payload || typeof payload !== "object") return [];
  return (
    (payload.list_invoices ??
      payload.list_stock_batch_invoice ??
      payload.list_stock_batch_invoices ??
      payload.list ??
      payload.data ??
      []) ||
    []
  );
}
