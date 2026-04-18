import { TCalendarEvent } from "./calendar.schema";

export const APPROVE_REACTIONS = new Set(["👍", "\u2764", "\u2764\uFE0F"]);
export const REJECT_REACTIONS = new Set(["👎", "💩"]);

function formatDate(isoDate: string): string {
  const [, month, day] = isoDate.split("-");
  return `${day}.${month}`;
}

export function prettifyEvent(event: TCalendarEvent): string {
  const lines: string[] = [
    `<b>${event.title}</b>`,
    `📅 ${formatDate(event.date)}`,
  ];

  if (event.description) {
    lines.push("", event.description);
  }

  lines.push("", "👍/❤️ — додати до календаря | 👎/💩 — відхилити");
  return lines.join("\n");
}
