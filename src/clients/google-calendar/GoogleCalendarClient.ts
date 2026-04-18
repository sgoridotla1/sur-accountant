import { google, calendar_v3 } from "googleapis";
import path from "path";

class GoogleCalendarClient {
  private calendar: calendar_v3.Calendar;
  private calendarId: string;

  constructor(pathToKeyfile: string, calendarId: string) {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/calendar"],
      keyFile: path.join(process.cwd(), pathToKeyfile),
    });

    this.calendar = google.calendar({ version: "v3", auth });
    this.calendarId = calendarId;
  }

  async createEvent(title: string, date: string, description?: string) {
    const res = await this.calendar.events.insert({
      calendarId: this.calendarId,
      requestBody: {
        summary: title,
        description,
        start: { date },
        end: { date },
      },
    });

    return res.data;
  }
}

export default GoogleCalendarClient;
