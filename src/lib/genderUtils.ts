/**
 * Hebrew gender-aware text utility.
 * gender field: 'ז' = male, 'נ' = female, null/undefined = neutral (slash form)
 */

export type Gender = 'ז' | 'נ' | string | null | undefined;

export function isMale(gender: Gender): boolean {
  return gender === 'ז';
}

export function isFemale(gender: Gender): boolean {
  return gender === 'נ';
}

/** Returns male form, female form, or slash form based on gender */
export function g(gender: Gender, male: string, female: string): string {
  if (isMale(gender)) return male;
  if (isFemale(gender)) return female;
  return `${male}/${female}`;
}

/** Common gendered Hebrew terms */
export function genderTerms(gender: Gender) {
  return {
    student: g(gender, 'תלמיד', 'תלמידה'),
    studentShort: g(gender, 'תלמיד', 'תלמידה'),
    present: g(gender, 'נוכח', 'נוכחת'),
    absent: g(gender, 'נעדר', 'נעדרת'),
    active: g(gender, 'פעיל', 'פעילה'),
    hero: g(gender, 'גיבור', 'גיבורה'),
    dear: g(gender, 'יקר', 'יקרה'),
    was: g(gender, 'היה', 'הייתה'),
    didNotCome: g(gender, 'לא הגיע', 'לא הגיעה'),
    wrote: g(gender, 'כתב', 'כתבה'),
    write: g(gender, 'כתוב', 'כתבי'),
    turnTo: g(gender, 'פנה', 'פני'),
    describe: g(gender, 'תאר', 'תארי'),
    switchStudent: g(gender, 'החלף תלמיד', 'החליפי תלמידה'),
    whatDoYouWant: g(gender, 'מה תרצה לעשות עכשיו?', 'מה תרצי לעשות עכשיו?'),
    heOrShe: g(gender, 'הוא', 'היא'),
    reported: g(gender, 'דווח', 'דווחה'),
    wasPresent: g(gender, 'הייתי', 'הייתי'), // first person same
    // Daily reflection descriptions (first person - same for both genders in most cases)
    // But some third-person descriptions differ
    behaved: g(gender, 'התנהג', 'התנהגה'),
  };
}
