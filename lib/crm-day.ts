const zone = 'America/Sao_Paulo';

const calendar = new Intl.DateTimeFormat('en-US', {
  timeZone: zone,
  year: 'numeric',
  month: '2-digit',
  day: '2-digit',
  hour: '2-digit',
  hourCycle: 'h23',
});

function parts(value: Date) {
  const fields = Object.fromEntries(
    calendar.formatToParts(value).map(({ type, value }) => [type, value]),
  );
  return {
    year: Number(fields.year),
    month: Number(fields.month),
    day: Number(fields.day),
    hour: Number(fields.hour),
  };
}

function midnight(year: number, month: number, day: number) {
  const target = Date.UTC(year, month - 1, day);
  let instant = target;
  // Translate the calendar midnight in Rio to UTC using the zone rules at that instant.
  for (let attempt = 0; attempt < 3; attempt += 1) {
    const local = parts(new Date(instant));
    const represented = Date.UTC(local.year, local.month - 1, local.day, local.hour);
    instant += target - represented;
  }
  return new Date(instant);
}

export function crmDayWindow(now: Date) {
  const { year, month, day } = parts(now);
  const next = new Date(Date.UTC(year, month - 1, day + 1));
  return {
    today: midnight(year, month, day),
    tomorrow: midnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate()),
  };
}

export function crmDayStartAfter(now: Date, days: number) {
  const { year, month, day } = parts(now);
  const next = new Date(Date.UTC(year, month - 1, day + days));
  return midnight(next.getUTCFullYear(), next.getUTCMonth() + 1, next.getUTCDate());
}
