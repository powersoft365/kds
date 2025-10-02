// app/kds-pro/components/SignalRBridge.jsx
"use client";

import React from "react";
import Script from "next/script";
import { toast } from "sonner";

/**
 * Classic ASP.NET SignalR (2.x) loader with:
 * - strict order (jQuery -> jquery.signalR-2.4.2 -> /signalr/hubs)
 * - toasts on connect/fail/disconnect
 * - exponential backoff reconnect
 * - calls onOrderUpdate when server emits "orderChanged"
 *
 * If your hub name / client method differ, change hubName / client handler.
 */
export default function SignalRBridge({
  onOrderUpdate,
  onAcknowledge,
  hubName = "notificationHub",
  withCredentials = false,
}) {
  const SIGNALR_BASE = process.env.NEXT_PUBLIC_SIGNALR_BASE;
  let SIGNALR_HUBS = process.env.NEXT_PUBLIC_SIGNALR_HUBS || "";
  if (SIGNALR_HUBS.endsWith("/")) SIGNALR_HUBS = SIGNALR_HUBS.slice(0, -1);

  const [jqReady, setJqReady] = React.useState(false);
  const [sigReady, setSigReady] = React.useState(false);
  const startedRef = React.useRef(false);
  const retryRef = React.useRef(0);
  const stopRequested = React.useRef(false);

  const scheduleReconnect = React.useCallback(() => {
    if (stopRequested.current) return;
    const base = 2000,
      max = 15000;
    const ms = Math.min(max, base * Math.pow(2, retryRef.current++));
    setTimeout(() => {
      if (!stopRequested.current) startConnection();
    }, ms);
  }, []);

  const startConnection = React.useCallback(() => {
    try {
      const $ = window.jQuery || window.$;
      if (!jqReady || !sigReady || !$ || !$.connection || startedRef.current)
        return;

      const hub = $.connection[hubName];
      if (!hub) {
        toast.error(`SignalR: hub "${hubName}" not found`);
        return;
      }

      hub.client.acknowledgeMessage = function (message) {
        if (typeof onAcknowledge === "function") onAcknowledge(message);
      };
      hub.client.orderChanged = function (payload) {
        try {
          const data =
            typeof payload === "string" ? JSON.parse(payload) : payload;
          if (typeof onOrderUpdate === "function") onOrderUpdate(data);
        } catch {
          if (typeof onOrderUpdate === "function") onOrderUpdate(payload);
        }
      };

      $.connection.hub.url = SIGNALR_BASE;
      $.connection.hub
        .start({ withCredentials })
        .done(function () {
          retryRef.current = 0;
          startedRef.current = true;
          toast.success("SignalR connected", {
            description: `Hub ID: ${$.connection.hub.id}`,
          });
        })
        .fail(function (err) {
          toast.error("SignalR connection failed", {
            description: err?.message || String(err),
          });
          scheduleReconnect();
        });

      $.connection.hub.disconnected(function () {
        startedRef.current = false;
        if (stopRequested.current) return;
        toast("SignalR disconnected", { description: "Reconnecting…" });
        scheduleReconnect();
      });
    } catch (err) {
      toast.error("SignalR init error", { description: String(err) });
      scheduleReconnect();
    }
  }, [
    jqReady,
    sigReady,
    SIGNALR_BASE,
    hubName,
    onAcknowledge,
    onOrderUpdate,
    scheduleReconnect,
    withCredentials,
  ]);

  React.useEffect(() => {
    startConnection();
    return () => {
      try {
        const $ = window.jQuery || window.$;
        stopRequested.current = true;
        if ($?.connection?.hub?.stop) $.connection.hub.stop();
      } catch {}
      startedRef.current = false;
    };
  }, [startConnection]);

  return (
    <>
      <Script
        src="https://cdnjs.cloudflare.com/ajax/libs/jquery/3.7.1/jquery.min.js"
        strategy="afterInteractive"
        onLoad={() => setJqReady(true)}
      />
      <Script
        src="https://ajax.aspnetcdn.com/ajax/signalr/jquery.signalR-2.4.2.min.js"
        strategy="afterInteractive"
        onLoad={() => setSigReady(true)}
      />
      {jqReady && sigReady ? (
        <Script
          src={SIGNALR_HUBS}
          strategy="afterInteractive"
          onLoad={startConnection}
        />
      ) : null}
    </>
  );
}
