import { google, sheets_v4 } from "googleapis";
// import { authenticate } from "@google-cloud/local-auth";
import path from "path";

// sheet_id:1Uj5gZ5slSUmVyYVAbV1NIicUVzxyf94d_MFoX9M2n_Q

class GoogleSheetsClient {
  private sheets: sheets_v4.Sheets;

  private constructor(sheets: sheets_v4.Sheets) {
    this.sheets = sheets;
  }

  static async init(): Promise<GoogleSheetsClient> {
    const auth = new google.auth.GoogleAuth({
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
      keyFile: path.join(process.cwd(), "./credentials/client_secret.json"),
    });

    const sheets = google.sheets({ version: "v4", auth });
    return new GoogleSheetsClient(sheets);
  }

  async read(spreadsheetId: string) {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId,
      range: "sur-accountant!A1:A",
    });

    console.log(res);

    const rows = res.data.values;

    return rows;
  }
}

export default GoogleSheetsClient;
