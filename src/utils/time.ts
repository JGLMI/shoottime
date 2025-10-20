export const nowISO = () => new Date().toISOString();
export const keyDay   = (d: Date) => d.toISOString().slice(0,10); // YYYY-MM-DD
export const keyMonth = (d: Date) => d.toISOString().slice(0,7);  // YYYY-MM
export const minutesBetween = (aISO: string, bISO: string) =>
  Math.round((new Date(bISO).getTime() - new Date(aISO).getTime())/60000);
export const fmtH = (min:number) =>
  `${Math.floor(min/60)}h${(min%60).toString().padStart(2,'0')}`;
