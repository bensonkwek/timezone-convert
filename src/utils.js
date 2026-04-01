const DATE_PATTERN = /\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\.??\s+\d{1,2}(?:,\s*\d{4})?\s*,?\s*\d{1,2}(?::\d{2})?(?::\d{2})?\s*(?:AM|PM)?\s*(?:(?:GMT|UTC)[+-]?\d{1,2}(?::?\d{2})?|[A-Za-z]{2,4}|[+-]\d{2}:?\d{2})\b|\b\d{4}-\d{2}-\d{2}[ T]\d{2}:\d{2}(?::\d{2})?\s*(?:[+-]\d{2}:?\d{2})\b/gi;

const MONTHS = {
  jan: 1,
  feb: 2,
  mar: 3,
  apr: 4,
  may: 5,
  jun: 6,
  jul: 7,
  aug: 8,
  sep: 9,
  oct: 10,
  nov: 11,
  dec: 12
};

function pad(value) {
  return String(value).padStart(2, '0');
}

function cleanupText(text) {
  return text.replace(/\s+/g, ' ').trim();
}

function parseTimeZoneOffset(raw) {
  if (!raw) return null;
  const normalized = raw.toUpperCase().replace(/\./g, '');
  if (TZ_OFFSET_MAP[normalized]) {
    return TZ_OFFSET_MAP[normalized];
  }
  const offsetMatch = normalized.match(/^([+-])(\d{2}):?(\d{2})$/);
  if (offsetMatch) {
    return `${offsetMatch[1]}${offsetMatch[2]}:${offsetMatch[3]}`;
  }
  const gmtMatch = normalized.match(/^(?:GMT|UTC)?([+-])(\d{1,2})(?::?(\d{2}))?$/);
  if (gmtMatch) {
    const [, sign, hourText, minuteText] = gmtMatch;
    const hour = String(Number(hourText)).padStart(2, '0');
    const minute = minuteText ? minuteText.padStart(2, '0') : '00';
    return `${sign}${hour}:${minute}`;
  }
  return null;
}

function parseDateTimeString(value) {
  const cleaned = cleanupText(value);
  const monthMatch = cleaned.match(/^([A-Za-z]{3,9})\.?\s+(\d{1,2})(?:,\s*(\d{4}))?\s*,?\s*(\d{1,2})(?::(\d{2}))?(?::(\d{2}))?\s*(AM|PM)?\s*((?:GMT|UTC)[+-]?\d{1,2}(?::?\d{2})?|[A-Za-z]{2,4}|[+-]\d{2}:?\d{2})?$/i);

  if (monthMatch) {
    const [, monthText, dayText, yearText, hourText, minuteText, secondText, meridiem, tzText] = monthMatch;
    const month = MONTHS[monthText.toLowerCase().slice(0, 3)];
    const day = Number(dayText);
    const year = yearText ? Number(yearText) : new Date().getFullYear();
    let hour = Number(hourText);
    const minute = minuteText ? Number(minuteText) : 0;
    const second = secondText ? Number(secondText) : 0;
    if (meridiem) {
      if (/PM/i.test(meridiem) && hour < 12) hour += 12;
      if (/AM/i.test(meridiem) && hour === 12) hour = 0;
    }
    const offset = parseTimeZoneOffset(tzText);
    if (!offset) return null;
    const iso = `${year}-${pad(month)}-${pad(day)}T${pad(hour)}:${pad(minute)}:${pad(second)}${offset}`;
    const parsed = new Date(iso);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  const isoMatch = cleaned.match(/^(\d{4}-\d{2}-\d{2})[ T](\d{2}:\d{2}(?::\d{2})?)\s*([+-]\d{2}:?\d{2})$/);
  if (isoMatch) {
    const [, datePart, timePart, offsetPart] = isoMatch;
    const normalizedOffset = parseTimeZoneOffset(offsetPart);
    if (!normalizedOffset) return null;
    const parsed = new Date(`${datePart}T${timePart}${normalizedOffset}`);
    return Number.isNaN(parsed.getTime()) ? null : parsed;
  }

  return null;
}

function parseOffsetToMinutes(offset) {
  const match = offset.match(/^([+-])(\d{2}):(\d{2})$/);
  if (!match) return null;
  const sign = match[1] === '+' ? 1 : -1;
  const hours = Number(match[2]);
  const minutes = Number(match[3]);
  return sign * (hours * 60 + minutes);
}

function formatForTimeZone(date, timeZone) {
  let target = timeZone;
  if (target === 'LOCAL') {
    target = Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC';
  }

  try {
    return new Intl.DateTimeFormat(undefined, {
      timeZone: target,
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZoneName: 'short'
    }).format(date);
  } catch (error) {
    const normalized = parseTimeZoneOffset(target);
    if (!normalized) return null;
    const offsetMinutes = parseOffsetToMinutes(normalized);
    if (offsetMinutes === null) return null;
    const adjustedDate = new Date(date.getTime() + offsetMinutes * 60000);
    const formatted = new Intl.DateTimeFormat(undefined, {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
      timeZone: 'UTC'
    }).format(adjustedDate);
    if (typeof target === 'string' && target.startsWith('GMT')) {
      return `${formatted} ${target}`;
    }
    return `GMT${normalized} ${formatted}`;
  }
}

function findDateStringInText(text) {
  if (!text) return null;
  const normalized = cleanupText(text);
  const match = normalized.match(DATE_PATTERN);
  return match ? match[0] : null;
}

if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    DATE_PATTERN,
    MONTHS,
    pad,
    cleanupText,
    parseTimeZoneOffset,
    parseDateTimeString,
    formatForTimeZone,
    findDateStringInText
  };
}
