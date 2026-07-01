export function isWorkingDay(date: Date): boolean {
  const day = date.getDay();
  if (day === 0) return false; // Sunday
  if (day === 6) {
    const weekOfMonth = Math.ceil(date.getDate() / 7);
    if (weekOfMonth === 2 || weekOfMonth === 4) return false; // 2nd/4th Saturday
  }
  return true;
}

export function isAllowedDiaryDate(date: Date): boolean {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  if (d > today) return false;
  if (d.getTime() === today.getTime()) return true;
  return isWorkingDay(d);
}
