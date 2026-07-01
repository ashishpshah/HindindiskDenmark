import { nowInDenmark, todayInDenmark } from "./denmarkTime";

export function isWeekend(dateStr: string): boolean {
  const day = new Date(dateStr).getDay(); // 0 = Sun, 6 = Sat
  return day === 0 || day === 6;
}

function parseMinutes(time: string): number {
  const [h, m] = time.split(":").map(Number);
  return h * 60 + m;
}

function formatMinutes(total: number): string {
  const h = Math.floor(total / 60);
  const m = total % 60;
  return `${String(h).padStart(2, "0")}:${String(m).padStart(2, "0")}`;
}

/**
 * Returns time slots between `open` and (`close` − `bufferMins`) at `intervalMins` intervals.
 * For today, slots already in the past (plus a 15-minute grace) are filtered out.
 */
export function availableTimeSlots(
  open: string,
  close: string,
  dateStr: string,
  intervalMins = 30,
  bufferMins = 60,
): string[] {
  const openTotal     = parseMinutes(open);
  const lastSlotTotal = parseMinutes(close) - bufferMins;

  const allSlots: string[] = [];
  for (let t = openTotal; t <= lastSlotTotal; t += intervalMins) {
    allSlots.push(formatMinutes(t));
  }

  const today = todayInDenmark();
  if (dateStr === today) {
    const now    = nowInDenmark();
    const cutoff = now.getHours() * 60 + now.getMinutes() + 15; // 15-min grace
    return allSlots.filter(s => parseMinutes(s) >= cutoff);
  }

  return allSlots;
}
