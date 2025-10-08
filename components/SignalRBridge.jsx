"use client";

import React from "react";
import Script from "next/script";
import { toast } from "sonner";

/**
 * Classic ASP.NET SignalR (2.x, jQuery-based) bridge
 *
 * - Loads jQuery + jquery.signalR + /signalr/hubs from your public/ + env URLs
 * - Connects to $.connection[hubName]
 * - Adds PS365 credentials to EVERY outgoing payload (token, device_id, etc.)
 * - Tries typed hub methods first; falls back to helloRestaurant(JSON.stringify(body))
 * - Exposes window.SignalR with helpers: send/startCooking/complete/revert/toggleItem/setEta
 * - Listens to acknowledgeMessage + orderChanged and shows toasts/logs
 */
export default function SignalRBridge({
  onOrderUpdate,
  onAcknowledge,
  hubName = "notificationHub",
  withCredentials = false,
}) {
  // --- URLs
  const SIGNALR_BASE = process.env.NEXT_PUBLIC_SIGNALR_BASE;
  const SIGNALR_HUBS = process.env.NEXT_PUBLIC_SIGNALR_HUBS;

  // --- Credentials (MUST be NEXT_PUBLIC_* to be available in the browser)
  const PS_TOKEN = process.env.NEXT_PUBLIC_PS365_TOKEN || ""; // no secret; client-side just like Msgs.html
  const PS_DEVICE = process.env.NEXT_PUBLIC_PS365_DEVICE_ID || "KDS_WEB";
  const PS_APP = process.env.NEXT_PUBLIC_PS365_APP_CODE || "KITCHENDISPLAY";
  const PS_DEFAULT_DEPT = process.env.NEXT_PUBLIC_PS365_DEFAULT_DEPT || ""; // optional

  const [jqReady, setJqReady] = React.useState(false);
  const [sigReady, setSigReady] = React.useState(false);
  const [hubsReady, setHubsReady] = React.useState(false);

  const hubRef = React.useRef(null);
  const startedRef = React.useRef(false);
  const retryRef = React.useRef(0);
  const stopRequested = React.useRef(false);

  const log = (...a) => console.log("[SignalR]", ...a);
  const err = (...a) => console.error("[SignalR]", ...a);

  const scheduleReconnect = React.useCallback(() => {
    if (stopRequested.current) return;
    const base = 1000,
      max = 15000;
    const ms = Math.min(max, base * Math.pow(2, retryRef.current++));
    setTimeout(() => !stopRequested.current && startConnection(), ms);
  }, []);

  const startConnection = React.useCallback(() => {
    try {
      const $ = window.jQuery || window.$;
      if (
        !jqReady ||
        !sigReady ||
        !hubsReady ||
        !$ ||
        !$.connection ||
        startedRef.current
      )
        return;

      const hub = $.connection[hubName];
      if (!hub) {
        toast.error(`SignalR: hub "${hubName}" not found`);
        return;
      }
      hubRef.current = hub;

      // Attach credentials also in QS (some servers read from there)
      $.connection.hub.qs = {
        token: PS_TOKEN,
        device_id: PS_DEVICE,
        application_code_365: PS_APP,
        // do not force dept here; we’ll send per-message
      };

      // INCOMING
      hub.client.acknowledgeMessage = (message) => {
        log("acknowledgeMessage:", message);
        // many servers return {response_code:"1", response_msg:"OK", response_id:""}
        const m =
          typeof message === "string" ? message : JSON.stringify(message);
        toast(m);
        if (typeof onAcknowledge === "function") onAcknowledge(message);
      };

      hub.client.orderChanged = (payload) => {
        log("orderChanged:", payload);
        toast("Order update received");
        if (typeof onOrderUpdate === "function") onOrderUpdate(payload);
      };

      // CONNECT
      $.connection.hub.url = SIGNALR_BASE;
      $.connection.hub
        .start({ withCredentials })
        .done(() => {
          retryRef.current = 0;
          startedRef.current = true;
          const hubId = $.connection.hub.id;
          toast.success("SignalR connected", {
            description: `Hub ID: ${hubId}`,
          });
          log("connected. hubId=", hubId, "url=", SIGNALR_BASE);
          if (!PS_TOKEN) {
            toast("PS365 token missing", {
              description: "Set NEXT_PUBLIC_PS365_TOKEN in .env",
            });
          }
        })
        .fail((e) => {
          err("start.fail:", e);
          toast.error("SignalR connection failed", {
            description: e?.message || String(e),
          });
          scheduleReconnect();
        });

      $.connection.hub.reconnecting(() => log("reconnecting…"));
      $.connection.hub.reconnected(() => {
        log("reconnected");
        toast.success("SignalR reconnected");
      });
      $.connection.hub.disconnected(() => {
        startedRef.current = false;
        if (stopRequested.current) return;
        toast("SignalR disconnected", { description: "Reconnecting…" });
        scheduleReconnect();
      });

      // ---- OUTGOING helpers
      function safeClone(p) {
        try {
          return typeof p === "object" ? JSON.parse(JSON.stringify(p)) : p;
        } catch {
          return p;
        }
      }

      function withCreds(payload, dept) {
        // server expects creds at TOP LEVEL (like Msgs.html)
        const body = {
          token: PS_TOKEN,
          device_id: PS_DEVICE,
          application_code_365: PS_APP,
          ...(dept ? { item_department_code_365: dept } : {}),
          ...safeClone(payload),
        };
        return body;
      }

      async function callPreferredOrFallback(methodName, payload, dept) {
        const hub = hubRef.current;
        if (!hub?.server) throw new Error("SignalR hub not ready");
        const body = withCreds(payload, dept);

        // Preferred: typed hub method
        if (hub.server[methodName]) return hub.server[methodName](body);

        // Fallback: helloRestaurant(JSON) (exactly like Msgs.html)
        if (hub.server.helloRestaurant) {
          return hub.server.helloRestaurant(JSON.stringify(body));
        }

        // Last resort: generic send
        if (hub.server.send) return hub.server.send(body);

        throw new Error(`No server method for "${methodName}"`);
      }

      const api = {
        /** Lowest-level generic sender */
        async send(type, payload, dept = PS_DEFAULT_DEPT) {
          const body = { type, ...safeClone(payload) };
          log("send:", type, body);
          await callPreferredOrFallback(type, body, dept);
          toast.success(`Sent: ${type}`);
          log("send.ok:", type);
        },

        /** Semantic helpers */
        async startCooking(order, dept = PS_DEFAULT_DEPT) {
          const payload = {
            kind: "startCooking",
            orderId: order?.id,
            eta: order?.eta ?? null,
            dest: order?.dest ?? null,
          };
          log("startCooking:", payload);
          await callPreferredOrFallback("startCooking", payload, dept);
          toast.success(`Order #${order?.id}: startCooking sent`);
        },

        async completeOrder(order, dept = PS_DEFAULT_DEPT) {
          const payload = {
            kind: "completeOrder",
            orderId: order?.id,
            dest: order?.dest ?? null,
          };
          log("completeOrder:", payload);
          await callPreferredOrFallback("completeOrder", payload, dept);
          toast.success(`Order #${order?.id}: complete sent`);
        },

        async revertOrder(order, dept = PS_DEFAULT_DEPT) {
          const payload = { kind: "revertOrder", orderId: order?.id };
          log("revertOrder:", payload);
          await callPreferredOrFallback("revertOrder", payload, dept);
          toast.success(`Order #${order?.id}: revert sent`);
        },

        async toggleItem(orderId, itemId, itemStatus, dept = PS_DEFAULT_DEPT) {
          const payload = { kind: "toggleItem", orderId, itemId, itemStatus };
          log("toggleItem:", payload);
          await callPreferredOrFallback("toggleItem", payload, dept);
          toast.success(`Item ${itemId}: ${itemStatus}`);
        },

        async setEta(orderId, etaMinutes, dept = PS_DEFAULT_DEPT) {
          const payload = { kind: "setEta", orderId, etaMinutes };
          log("setEta:", payload);
          await callPreferredOrFallback("setEta", payload, dept);
          toast.success(`Order #${orderId}: ETA ${etaMinutes}m sent`);
        },
      };

      if (typeof window !== "undefined") {
        window.SignalR = api;
        log("window.SignalR API ready:", Object.keys(api));
      }
    } catch (e) {
      err("init error:", e);
      toast.error("SignalR init error", { description: String(e) });
      scheduleReconnect();
    }
  }, [
    jqReady,
    sigReady,
    hubsReady,
    SIGNALR_BASE,
    SIGNALR_HUBS,
    hubName,
    onAcknowledge,
    onOrderUpdate,
    scheduleReconnect,
    withCredentials,
    PS_TOKEN,
    PS_DEVICE,
    PS_APP,
    PS_DEFAULT_DEPT,
  ]);

  React.useEffect(() => {
    startConnection();
    return () => {
      try {
        stopRequested.current = true;
        const $ = window.jQuery || window.$;
        if ($?.connection?.hub?.stop) $.connection.hub.stop();
      } catch {}
      startedRef.current = false;
      if (typeof window !== "undefined" && window.SignalR)
        delete window.SignalR;
    };
  }, [startConnection]);

  return (
    <>
      {/* load from your public/ folder (your screenshot shows these files exist) */}
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
        strategy="afterInteractive"
        onLoad={() => setJqReady(true)}
      />
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/signalr.js/2.4.2/jquery.signalR.min.js"
        strategy="afterInteractive"
        onLoad={() => setSigReady(true)}
      />
      {jqReady && sigReady ? (
        <Script
          src={SIGNALR_HUBS}
          strategy="afterInteractive"
          onLoad={() => setHubsReady(true)}
          onError={() => toast.error("Failed to load /signalr/hubs")}
        />
      ) : null}
    </>
  );
}
