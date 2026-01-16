export function formatTelegramDate(date: number) {
  return new Intl.DateTimeFormat("en-GB").format(date * 1000);
}
