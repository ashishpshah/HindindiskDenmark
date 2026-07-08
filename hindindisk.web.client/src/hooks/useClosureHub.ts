import { useEffect } from "react";
import * as signalR from "@microsoft/signalr";
import { useQueryClient } from "@tanstack/react-query";
import { BASE } from "@/lib/api/client";

export function useClosureHub(branchIds: number | number[] | undefined) {
  const qc  = useQueryClient();
  const ids = Array.isArray(branchIds) ? branchIds : branchIds != null ? [branchIds] : [];
  const idsKey = ids.join(","); // stable primitive for useEffect dep

  useEffect(() => {
    if (ids.length === 0) return;

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${BASE}/hubs/closures`)
      .withAutomaticReconnect()
      .configureLogging(signalR.LogLevel.Warning)
      .build();

    connection.on("ClosuresChanged", (branchId: number) => {
      qc.invalidateQueries({ queryKey: ["branch-closures", branchId] });
      qc.invalidateQueries({ queryKey: ["slots"] });
    });

    connection.on("ServiceStatusChanged", (branchId: number) => {
      qc.invalidateQueries({ queryKey: ["branches"] });
      qc.invalidateQueries({ queryKey: ["service-status", branchId] });
    });

    let subscribed = false;
    connection
      .start()
      .then(async () => {
        for (const id of ids) await connection.invoke("Subscribe", id);
        subscribed = true;
      })
      .catch(console.error);

    return () => {
      const stop = () => connection.stop().catch(() => {});
      if (subscribed) {
        Promise.all(ids.map(id => connection.invoke("Unsubscribe", id).catch(() => {})))
          .finally(stop);
      } else {
        stop();
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [idsKey, qc]);
}
