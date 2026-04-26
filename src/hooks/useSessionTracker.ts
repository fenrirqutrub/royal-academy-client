// src/hooks/useSessionTracker.ts
// App root এ একবার mount করলেই হবে — heartbeat + active time tracking

import { useEffect, useRef } from "react";
import axiosPublic from "./axiosPublic";
import { useAuth } from "../context/AuthContext";

const HEARTBEAT_INTERVAL = 30_000; // 30 সেকেন্ড

export const useSessionTracker = () => {
  const { isAuthenticated } = useAuth();
  const activeSecondsRef = useRef(0);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const tickerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const visibleRef = useRef(document.visibilityState === "visible");

  useEffect(() => {
    if (!isAuthenticated) {
      // Cleanup যদি logout হয়
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
      if (tickerRef.current) clearInterval(tickerRef.current);
      activeSecondsRef.current = 0;
      return;
    }

    // ── Page visibility change ──
    const onVisibilityChange = () => {
      visibleRef.current = document.visibilityState === "visible";
    };
    document.addEventListener("visibilitychange", onVisibilityChange);

    // ── প্রতি সেকেন্ডে active time বাড়াও (visible থাকলেই) ──
    tickerRef.current = setInterval(() => {
      if (visibleRef.current) {
        activeSecondsRef.current += 1;
      }
    }, 1000);

    // ── প্রতি ৩০ সেকেন্ডে heartbeat ──
    heartbeatRef.current = setInterval(async () => {
      const seconds = activeSecondsRef.current;
      activeSecondsRef.current = 0; // reset আগে করো, race condition এড়াতে

      try {
        await axiosPublic.post("/api/sessions/heartbeat", {
          activeSeconds: seconds,
        });
      } catch {
        // silent fail — heartbeat miss হলে সমস্যা নেই
      }
    }, HEARTBEAT_INTERVAL);

    return () => {
      document.removeEventListener("visibilitychange", onVisibilityChange);
      if (tickerRef.current) clearInterval(tickerRef.current);
      if (heartbeatRef.current) clearInterval(heartbeatRef.current);
    };
  }, [isAuthenticated]);
};
