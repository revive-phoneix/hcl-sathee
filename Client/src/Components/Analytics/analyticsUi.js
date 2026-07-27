export const attendanceBadge = (val) => {
  if (val == null) return "bg-gray-100 text-gray-600 border border-gray-200";
  if (val >= 95) return "bg-green-100 text-green-700 border border-green-200";
  if (val >= 85) return "bg-yellow-100 text-yellow-700 border border-yellow-200";
  return "bg-red-100 text-red-700 border border-red-200";
};

export const performanceBadge = (level) => {
  const map = {
    Excellent: "bg-green-100 text-green-700 border border-green-200",
    Good: "bg-blue-100 text-blue-700 border border-blue-200",
    Average: "bg-yellow-100 text-yellow-700 border border-yellow-200",
    "Needs Improvement": "bg-red-100 text-red-700 border border-red-200",
  };
  return map[level] || "bg-gray-100 text-gray-600";
};

export const mentorInitial = (name = "") => {
  const parts = String(name).trim().split(/\s+/).filter(Boolean);
  return parts.length ? parts[parts.length - 1][0].toUpperCase() : "?";
};

export const tableHeadRowClass = { backgroundColor: "#CCD2DD" };

export const zebraRowClass = (i) =>
  `hover:bg-blue-50 ${i % 2 === 0 ? "bg-white" : "bg-gray-50/50"}`;
