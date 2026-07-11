import { useEffect, useCallback } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { BASE } from "@/lib/api/client";

function getClientToken(): string | null {
  try {
    const raw = localStorage.getItem("hind-token");
    return raw ? (JSON.parse(raw) as string) : null;
  } catch {
    return null;
  }
}

export type NewOrderEvent = {
  id: number;
  status: string;
  contactName: string;
  total: number;
};

export function useAdminHub(onNewOrder?: (ev: NewOrderEvent) => void) {
  const qc = useQueryClient();

  useEffect(() => {
    const token = getClientToken();
    if (!token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/admin`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("NewOrder", (ev: NewOrderEvent) => {
      qc.invalidateQueries({ queryKey: ["admin-dashboard"] });
      qc.invalidateQueries({ queryKey: ["admin-order-counts-by-status"] });
      qc.invalidateQueries({ queryKey: ["admin-branch-overview"] });
      onNewOrder?.(ev);
    });

    connection.start().catch(console.error);
    return () => { connection.stop().catch(() => {}); };
  }, [qc, onNewOrder]);
}
