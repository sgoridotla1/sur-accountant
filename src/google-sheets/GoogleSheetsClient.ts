import { google, sheets_v4 } from "googleapis";
// import { authenticate } from "@google-cloud/local-auth";
import path from "path";

class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets;

  private constructor(sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
  }

  static async init(pathToKeyfile: string): Promise<GoogleSheetsClient> {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      keyFile: path.join(process.cwd(), pathToKeyfile),
    });

    const sheets = google.sheets({ version: "v4", auth });
    return new GoogleSheetsClient(sheets);
  }

  async read(spreadsheetId: string, range: string) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range,
    });

    const rows = res.data;
    return rows;
  }

  async write(
    spreadsheetId: string,
    range: string,
    values: (string | number | boolean)[],
  ) {
    const res = await this.sheets.spreadsheets.values.append({
      spreadsheetId,
      range,
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [values],
      },
    });

    return res.data;
  }
}

export default GoogleSheetsClient;
