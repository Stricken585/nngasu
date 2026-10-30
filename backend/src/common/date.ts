// Дата занятия хранится как DATE (без времени): в API ходит строка YYYY-MM-DD.
export const parseDay = (s: string) => new Date(`${s}T00:00:00.000Z`);
export const formatDay = (d: Date) => d.toISOString().slice(0, 10);
export const today = () => formatDay(new Date());
