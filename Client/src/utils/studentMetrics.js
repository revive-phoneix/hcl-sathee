export const parsePercentValue = (value) => {
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const parsed = parseFloat(String(value ?? "").replace("%", "").trim());
  return Number.isFinite(parsed) ? parsed : null;
};

export const parseJsonField = (value) => {
  if (value && typeof value === "object" && !Array.isArray(value)) return value;
  if (typeof value !== "string" || !value.trim()) return {};
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" && !Array.isArray(parsed)
      ? parsed
      : {};
  } catch {
    return {};
  }
};

export const average = (values) => {
  if (!values.length) return null;
  return values.reduce((sum, value) => sum + value, 0) / values.length;
};

export const getStudentAttendanceRates = (student) => {
  const rates = [];

  if (Array.isArray(student.attendances)) {
    for (const record of student.attendances) {
      const candidates = [
        record.dailyAttendancePercentage,
        record.weeklyAttendancePercentage,
        record.monthlyAttendancePercentage,
        record.attendancePercentage, // legacy fallback
      ];

      for (const value of candidates) {
        const rate = parsePercentValue(value);
        if (rate != null) rates.push(rate);
      }
    }
  }

  for (const value of Object.values(parseJsonField(student.attendance))) {
    const rate = parsePercentValue(value);
    if (rate != null) rates.push(rate);
  }

  return rates;
};

export const getStudentProgressRates = (student) => {
  const scores = [];

  if (Array.isArray(student.performances)) {
    for (const record of student.performances) {
      const marks = parsePercentValue(record.marks);
      const maxMarks = parsePercentValue(record.maxMarks) || 100;
      if (marks != null && maxMarks > 0) {
        scores.push((marks / maxMarks) * 100);
      }
    }
  }

  for (const value of Object.values(parseJsonField(student.marks))) {
    const marks = parsePercentValue(value);
    if (marks != null) {
      scores.push(marks > 100 ? 100 : marks);
    }
  }

  return scores;
};
