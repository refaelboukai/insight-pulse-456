import { HebrewCalendar, HDate, flags } from '@hebcal/core';

// Get Hebrew date string for a given Gregorian date
export function getHebrewDateForDay(year: number, month: number, day: number): string {
  const hd = new HDate(new Date(year, month, day));
  return hd.renderGematriya();
}

// Get Hebrew day number only (for calendar cell display)
export function getHebrewDay(year: number, month: number, day: number): string {
  const hd = new HDate(new Date(year, month, day));
  return hd.renderGematriya(true); // short form - just day
}

interface HebrewHoliday {
  title: string;
  date: string; // YYYY-MM-DD
  emoji: string;
  isYomTov: boolean;
  isErev: boolean;
}

// Get Jewish holidays for a given Gregorian month
export function getJewishHolidaysForMonth(year: number, month: number): HebrewHoliday[] {
  const startDate = new Date(year, month, 1);
  const endDate = new Date(year, month + 1, 0);

  const events = HebrewCalendar.calendar({
    start: new HDate(startDate),
    end: new HDate(endDate),
    isHebrewYear: false,
    il: true, // Israel schedule
    noMinorFast: false,
    noModern: false,
    noRoshChodesh: false,
    noSpecialShabbat: true,
    sedrot: false,
    omer: false,
    shabbatMevarchim: false,
  });

  const holidays: HebrewHoliday[] = [];

  for (const ev of events) {
    const hd = ev.getDate();
    const greg = hd.greg();
    const dateStr = `${greg.getFullYear()}-${String(greg.getMonth() + 1).padStart(2, '0')}-${String(greg.getDate()).padStart(2, '0')}`;
    
    const f = ev.getFlags();
    const isYomTov = !!(f & flags.CHAG);
    const desc = ev.render('he');
    const isErev = desc.includes('ערב') || desc.includes('erev');

    let emoji = '✡️';
    if (isYomTov) emoji = '🕎';
    if (isErev) emoji = '🌅';
    if (f & flags.ROSH_CHODESH) emoji = '🌙';
    if (f & flags.MINOR_FAST || f & flags.MAJOR_FAST) emoji = '🕐';
    if (desc.includes('פורים') || desc.includes('Purim')) emoji = '🎭';
    if (desc.includes('חנוכה') || desc.includes('Chanukah')) emoji = '🕎';
    if (desc.includes('פסח') || desc.includes('Pesach')) emoji = '🍷';
    if (desc.includes('סוכות') || desc.includes('Sukkot')) emoji = '🌿';
    if (desc.includes('שבועות') || desc.includes("Shavu'ot")) emoji = '📜';
    if (desc.includes('ראש השנה') || desc.includes('Rosh Hashana')) emoji = '🍯';
    if (desc.includes('יום כיפור') || desc.includes('Yom Kippur')) emoji = '🙏';
    if (desc.includes('עצמאות') || desc.includes('Independence')) emoji = '🇮🇱';
    if (desc.includes('זיכרון') || desc.includes('Remembrance') || desc.includes('השואה')) emoji = '🕯️';
    if (desc.includes('ל"ג בעומר') || desc.includes("Lag B'Omer")) emoji = '🔥';

    holidays.push({
      title: desc,
      date: dateStr,
      emoji,
      isYomTov,
      isErev,
    });
  }

  return holidays;
}

// Get birthday students for a given month
export interface BirthdayEntry {
  id: string;
  name: string;
  date_of_birth: string;
  dayOfMonth: number;
  age: number;
}

export function getBirthdaysForMonth(
  students: { id: string; first_name: string; last_name: string; date_of_birth: string | null }[],
  year: number,
  month: number // 0-indexed
): BirthdayEntry[] {
  const currentYear = new Date().getFullYear();
  return students
    .filter(s => {
      if (!s.date_of_birth) return false;
      const dob = new Date(s.date_of_birth);
      return dob.getMonth() === month;
    })
    .map(s => {
      const dob = new Date(s.date_of_birth!);
      return {
        id: s.id,
        name: `${s.first_name} ${s.last_name}`,
        date_of_birth: s.date_of_birth!,
        dayOfMonth: dob.getDate(),
        age: currentYear - dob.getFullYear(),
      };
    })
    .sort((a, b) => a.dayOfMonth - b.dayOfMonth);
}
