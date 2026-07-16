function parseDateOnly(dateStr) {
  // Avoids timezone shift issues from new Date("YYYY-MM-DD") being parsed as UTC
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

function startOfDay(date) {
  const d = new Date(date);
  d.setHours(0, 0, 0, 0);
  return d;
}
function getMonday(date) {
  const d = startOfDay(date);
  const day = d.getDay(); // 0 = Sunday, 1 = Monday, ...
  const diff = day === 0 ? -6 : 1 - day; //  Sunday is an exception to formula, this hardcodes it to -6
  d.setDate(d.getDate() + diff);
  return d;
}
function addDays(date, days) {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}
