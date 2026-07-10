import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { BASE } from "@/lib/api/client";

export type ActivityItem = {
  key: string;
  orderId: number;
  status: string;
  at: Date;
};

type Ctx = {
  activities: ActivityItem[];
  clearActivities: () => void;
};

const CustomerHubContext = createContext<Ctx>({ activities: [], clearActivities: () => {} });

function getClientToken(): string | null {
  try {
    const raw = localStorage.getItem("hind-token");
    return raw ? (JSON.parse(raw) as string) : null;
  } catch { return null; }
}

const MAX_ACTIVITIES = 10;

export function CustomerHubProvider({ userId, children }: { userId: number | undefined; children: ReactNode }) {
  const qc = useQueryClient();
  const [activities, setActivities] = useState<ActivityItem[]>([]);

  useEffect(() => {
    const token = getClientToken();
    if (!userId || !token) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/customer`, { accessTokenFactory: () => token })
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("OrderStatusChanged", (orderId: number, status: string) => {
      qc.invalidateQueries({ queryKey: ["my-orders"] });
      qc.invalidateQueries({ queryKey: ["order", String(orderId)] });
      setActivities(prev =>
        [{ key: `${orderId}-${Date.now()}`, orderId, status, at: new Date() }, ...prev]
          .slice(0, MAX_ACTIVITIES),
      );
    });

    connection.on("ReservationStatusChanged", () => {
      qc.invalidateQueries({ queryKey: ["my-reservations"] });
    });

    connection.start().catch(console.error);
    return () => { connection.stop().catch(() => {}); };
  }, [userId, qc]);

  return (
    <CustomerHubContext.Provider value={{ activities, clearActivities: () => setActivities([]) }}>
      {children}
    </CustomerHubContext.Provider>
  );
}

export function useCustomerActivities() {
  return useContext(CustomerHubContext);
}
