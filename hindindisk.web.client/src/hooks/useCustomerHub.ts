import { useEffect } from "react";
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

export function useCustomerHub(userId: number | undefined) {
  const qc = useQueryClient();

  useEffect(() => {
    const token = getClientToken();
    if (!userId || !token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/customer`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("OrderStatusChanged", (orderId: number) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["order", String(orderId)] });
    });

    connection.on("ReservationStatusChanged", () => {
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    });

    connection.start().catch(console.error);

    return () => { connection.stop().catch(() => {}); };
  }, [userId, qc]);
}
