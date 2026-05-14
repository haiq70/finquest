export function fmtCurrency(amount: number): string {
  return '€' + amount.toLocaleString('en', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });
}

export function fmtDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'short',
  });
}

export function fmtDateFull(iso: string): string {
  return new Date(iso).toLocaleDateString('en-GB', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  });
}

export function todayString(): string {
  return new Date().toDateString();
}

export function yesterdayString(): string {
  const d = new Date();
  d.setDate(d.getDate() - 1);
  return d.toDateString();
}

export function getGreeting(): string {
  const h = new Date().getHours();
  if (h < 12) return 'Good morning';
  if (h < 18) return 'Good afternoon';
  return 'Good evening';
}

export function groupByDate(
  items: Array<{ date: string; [key: string]: any }>
): Array<{ title: string; data: typeof items }> {
  const map = new Map<string, typeof items>();
  items.forEach(item => {
    const d = new Date(item.date).toDateString();
    if (!map.has(d)) map.set(d, []);
    map.get(d)!.push(item);
  });
  return Array.from(map.entries()).map(([dateStr, data]) => {
    const today = new Date().toDateString();
    const yesterday = yesterdayString();
    let title = dateStr;
    if (dateStr === today) title = 'Today';
    else if (dateStr === yesterday) title = 'Yesterday';
    else title = new Date(dateStr).toLocaleDateString('en-GB', { day: 'numeric', month: 'long' });
    return { title, data };
  });
}
