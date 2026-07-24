export const WEEKDAYS = [
  "Monday",
  "Tuesday",
  "Wednesday",
  "Thursday",
  "Friday",
  "Saturday",
  "Sunday",
];

export const WEEKDAY_SHORT = {
  Monday: "Mon",
  Tuesday: "Tue",
  Wednesday: "Wed",
  Thursday: "Thu",
  Friday: "Fri",
  Saturday: "Sat",
  Sunday: "Sun",
};

export const formatAvailableDays = (days = []) => {
  if (!Array.isArray(days) || days.length === 0) return "—";
  return days.map((day) => WEEKDAY_SHORT[day] || day).join(", ");
};
