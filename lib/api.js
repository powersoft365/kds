// lib/api.js
const PROXY = "/api/ps365";

function okPayload(p) {
  const code = (p && (p.response_code || p.api_response?.response_code)) ?? "";
  return String(code) === "1";
}

async function postJSON(path, body = {}, { signal } = {}) {
  const res = await fetch(`${PROXY}/${path.replace(/^\//, "")}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
    signal,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !okPayload(json)) {
    const rc =
      json?.response_code || json?.api_response?.response_code || res.status;
    const msg =
      json?.response_msg ||
      json?.api_response?.response_msg ||
      res.statusText ||
      "Unknown error";
    throw new Error(`POST ${path} failed (${rc}): ${msg}`);
  }
  return json;
}

async function getJSON(path, query = {}) {
  // Remove undefined/null so we never leak "…=undefined"
  const clean = {};
  for (const [k, v] of Object.entries(query || {})) {
    if (v === undefined || v === null) continue;
    clean[k] = v;
  }
  const qs = new URLSearchParams(clean).toString();
  const res = await fetch(
    `${PROXY}/${path.replace(/^\//, "")}${qs ? `?${qs}` : ""}`,
    { method: "GET", headers: { "content-type": "application/json" } }
  );
  const json = await res.json().catch(() => ({}));
  if (!res.ok || !okPayload(json)) {
    const rc =
      json?.response_code || json?.api_response?.response_code || res.status;
    const msg =
      json?.response_msg ||
      json?.api_response?.response_msg ||
      res.statusText ||
      "Unknown error";
    throw new Error(`GET ${path} failed (${rc}): ${msg}`);
  }
  return json;
}

/* ------------ existing wrappers unchanged ------------ */
export async function listBatchOrders({
  pageNumber = 1,
  pageSize = 24,
  onlyCounted = "N",
  itemDepartmentSelection = "",
  invoice365Selection = "",
  signal,
} = {}) {
  return postJSON(
    "list_stock_batch_invoice",
    {
      filter_define: {
        page_number: pageNumber,
        page_size: pageSize,
        only_counted: String(onlyCounted),
        invoice_type: "all",
        invoice_system_status: "all",
        invoice_status_selection: "",
        item_department_selection: itemDepartmentSelection || "",
        invoice_customer_selection: "",
        shopping_cart_code_selection: "",
        invoice_365_code_selection: invoice365Selection || "",
        invoice_customer_email_selection: "",
        invoice_customer_mobile_number_selection: "",
        invoice_store_selection: "",
        invoice_station_selection: "",
        from_invoice_date_utc0: "",
        to_invoice_date_utc0: "",
        from_invoice_delivery_date_utc0: "",
        to_invoice_delivery_date_utc0: "",
        list_modifiers: [],
        list_invoice_payments: [],
      },
    },
    { signal }
  );
}
export async function listBatchOrderHeaders(opts = {}) {
  return listBatchOrders({ ...opts });
}
export async function getBatchOrderByShoppingCart({
  shopping_cart_code,
  by_365_code = true,
}) {
  return getJSON("stock_batch_invoice", {
    shopping_cart_code,
    by_365_code: by_365_code ? "true" : "false",
  });
}
export async function bulkChangeBatchOrderStatus(rows = []) {
  if (!Array.isArray(rows) || rows.length === 0)
    throw new Error("bulkChangeBatchOrderStatus: rows[] required");
  const normalized = rows.map((r) => ({
    batch_invoice_number_365:
      r.batch_invoice_number_365 ?? r.batch_invoice_code_365 ?? "",
    batch_invoice_code_365:
      r.batch_invoice_code_365 ?? r.batch_invoice_number_365 ?? "",
    line_id_365: r.line_id_365 ?? "",
    status_code_365: r.status_code_365,
    item_department_code_365: r.item_department_code_365 ?? "",
    time_to_complete: Number(r.time_to_complete ?? 0),
  }));
  return postJSON("list_stock_batch_invoice_change_status", {
    list_stock_batch_invoice: normalized,
  });
}
export async function listTableSettings({
  pageNumber = 1,
  pageSize = 50,
  onlyCounted = "N",
  signal,
} = {}) {
  return postJSON(
    "list_table_settings",
    {
      filter_define: {
        page_number: pageNumber,
        page_size: pageSize,
        only_counted: String(onlyCounted),
      },
    },
    { signal }
  );
}
export async function listFloorTables({ signal } = {}) {
  return postJSON("list_floor_tables", { filter_define: {} }, { signal });
}
export function readOrdersList(payload) {
  if (!payload || typeof payload !== "object") return [];
  return (
    payload.list_stock_batch_invoice ||
    payload.list_invoices ||
    payload.invoices ||
    payload.list ||
    []
  );
}
export function readTotalCount(payload) {
  if (!payload || typeof payload !== "object") return 0;
  return (
    payload.total_count_list_stock_batch_invoice ||
    payload.total_count_list_invoices ||
    payload.total ||
    0
  );
}
export async function fetchInvoiceBy365Code(invoice365Code) {
  const res = await listBatchOrders({
    pageNumber: 1,
    pageSize: 1,
    onlyCounted: "N",
    invoice365Selection: String(invoice365Code || ""),
  });
  const list = readOrdersList(res);
  return Array.isArray(list) && list.length ? list[0] : null;
}

/* ------------ Modifiers (GET /list_modifiers) ------------ */
export async function listModifiers({ pageNumber = 1, pageSize = 100 } = {}) {
  // Token is appended by the proxy (route.js) to the query string
  const res = await getJSON("list_modifiers", {
    page_number: pageNumber,
    page_size: pageSize,
  });

  const list = res?.list_modifiers || res?.modifiers || res?.list || [];
  return list.map((m, i) => ({
    code: m.modifier_code_365 || m.code || `mod-${i + 1}`,
    name: m.modifier_name || m.name || `Modifier ${i + 1}`,
  }));
}

/* (optional) keep if you later persist modifiers as lines */
export async function addModifiersToOrder({
  batchInvoiceNumber365,
  tableId,
  parentLineId365,
  selectedModifiers,
  signal,
}) {
  if (
    !batchInvoiceNumber365 ||
    !Array.isArray(selectedModifiers) ||
    selectedModifiers.length === 0
  ) {
    return { ok: true, skipped: true };
  }

  const list_invoice_details = selectedModifiers.map((m, idx) => ({
    line_number: String(idx + 1),
    item_code_365: m.code,
    item_name: m.name,
    line_quantity: "1",
    line_price_incl_vat: 0,
    line_total_grand: 0,
    is_modifier: true,
    is_subitem: false,
    exclude_print: false,
    root_line_id_365: parentLineId365 || "",
  }));

  const payload = {
    batch_invoice: {
      batch_invoice_number_365: String(batchInvoiceNumber365),
      ...(tableId ? { table_id: String(tableId) } : {}),
      list_invoice_details,
    },
  };

  try {
    await postJSON("stock_batch_invoice_add_items", payload, { signal });
    return { ok: true };
  } catch (e) {
    return { ok: false, error: e?.message || "unknown" };
  }
}
