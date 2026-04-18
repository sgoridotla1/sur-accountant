import z from "zod";

const calendarEventSchema = z.object({
  title: z.string(),
  date: z.string().regex(/\d{4}-\d{2}-\d{2}/),
  description: z.string().optional(),
});

export const calendarResponseSchema = z.object({
  events: z.array(calendarEventSchema),
});

export type TCalendarResponse = z.infer<typeof calendarResponseSchema>;
export type TCalendarEvent = TCalendarResponse["events"][number];
