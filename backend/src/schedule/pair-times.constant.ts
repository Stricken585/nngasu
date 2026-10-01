// Время пар не хранится в БД. Дублируется во
// frontend/src/features/schedule/pairTimes.ts — держать в синхроне.
export const PAIR_TIMES: Record<number, { start: string; end: string }> = {
  1: { start: '9:00', end: '10:30' },
  2: { start: '10:40', end: '12:10' },
  3: { start: '12:40', end: '14:10' },
  4: { start: '14:20', end: '15:50' },
  5: { start: '16:00', end: '17:30' },
  6: { start: '17:40', end: '19:10' },
};

export const MIN_PAIR = 1;
export const MAX_PAIR = 6;
