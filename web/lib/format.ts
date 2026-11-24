const inr = new Intl.NumberFormat("en-IN", { maximumFractionDigits: 0 });
const dayMonthYear = new Intl.DateTimeFormat("en-IN", {
  day: "numeric",
  month: "short",
  year: "numeric",
  timeZone: "UTC",
});
const monthName = new Intl.DateTimeFormat("en-IN", { month: "long", timeZone: "UTC" });

const LAKH = 100000;

// Indian grouping with the rupee sign: ₹1,10,000.
export function formatInr(amount: number): string {
  return `₹${inr.format(Math.round(amount))}`;
}

// Plain wording for people: ₹2.4 lakh from one lakh up, ₹20,000 below that.
export function formatMoney(amount: number): string {
  if (amount < LAKH) return formatInr(amount);
  const lakh = Math.round((amount / LAKH) * 100) / 100;
  return `₹${lakh} lakh`;
}

// Dates are ISO (YYYY-MM-DD). Parse as UTC so the day never shifts with the time zone.
function parseIso(iso: string): Date {
  return new Date(`${iso}T00:00:00Z`);
}

export function formatDate(iso: string): string {
  return dayMonthYear.format(parseIso(iso));
}

export function monthOf(iso: string): string {
  return monthName.format(parseIso(iso));
}
