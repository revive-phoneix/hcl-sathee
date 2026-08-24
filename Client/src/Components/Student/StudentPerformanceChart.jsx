import { useMemo, useState } from "react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  LabelList,
} from "recharts";

const PERFORMANCE_CONFIG = {
  performance: {
    title: "Weekly Performance Tests",
    subtitle: "Test performance across weeks (Week 1, 2, 3)",
    labels: ["Week 1", "Week 2", "Week 3"],
  },
  "pre-mid": {
    title: "Pre-Mid Tests (Monthly)",
    subtitle: "Test performance across months (Month 1, 2, 3)",
    labels: ["Month 1", "Month 2", "Month 3"],
  },
  mid: {
    title: "Mid Tests (in Six Months)",
    subtitle: "Test performance across mid tests (Mid 1, 2, 3)",
    labels: ["Mid 1", "Mid 2", "Mid 3"],
  },
};

export default function StudentPerformanceChart({ student }) {
  const [selectedTestType, setSelectedTestType] = useState("performance");

  const config = PERFORMANCE_CONFIG[selectedTestType];

  const chartData = useMemo(() => {
    if (!student || !config) return [];

    const filteredMarks = (Array.isArray(student.testMarks) ? student.testMarks : []).filter(
      (mark) => (mark?.testType || "performance") === selectedTestType
    );

    // Group by test and calculate performance
    const byTest = {};
    for (const mark of filteredMarks) {
      if (!mark || !mark.testId) continue;
      if (!byTest[mark.testId]) {
        byTest[mark.testId] = {
          testId: mark.testId,
          testNumber: mark.testNumber || 0,
          marks: [],
          created_at: mark.created_at,
        };
      }
      const percentage = mark.subjectPercentage ?? null;
      if (percentage != null) {
        byTest[mark.testId].marks.push(Number(percentage));
      }
    }

    // Sort by test number and create chart data
    const tests = Object.values(byTest)
      .sort((a, b) => a.testNumber - b.testNumber)
      .slice(0, 3);

    return config.labels.map((label, index) => {
      const test = tests[index];
      if (!test || !test.marks.length) {
        return {
          label,
          percentage: null,
          barValue: 0,
        };
      }

      const avg = test.marks.reduce((sum, val) => sum + val, 0) / test.marks.length;
      const rounded = Math.round(avg * 10) / 10;

      return {
        label,
        percentage: rounded,
        barValue: rounded,
      };
    });
  }, [student, selectedTestType, config]);

  if (!student) return null;

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-6">
        <div className="mb-4 flex flex-col items-start justify-between gap-3 sm:flex-row sm:items-center">
          <div>
            <h2 className="text-lg font-bold text-slate-900">{config.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{config.subtitle}</p>
          </div>

          <div className="flex gap-2">
            {Object.entries(PERFORMANCE_CONFIG).map(([key]) => (
              <button
                key={key}
                type="button"
                onClick={() => setSelectedTestType(key)}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  selectedTestType === key
                    ? "bg-blue-600 text-white shadow-sm"
                    : "border border-slate-200 bg-white text-slate-700 hover:bg-slate-50"
                }`}
              >
                {key === "performance" ? "Weekly" : key === "pre-mid" ? "Monthly" : "Mid"}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="h-72 rounded-2xl border border-slate-200 bg-slate-50 p-4">
        {!chartData.length ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            No test data available for this student yet.
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData} margin={{ top: 24, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis
                dataKey="label"
                tick={{ fontSize: 12, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                domain={[0, 100]}
                tick={{ fontSize: 11, fill: "#64748B" }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip
                content={({ active, payload }) => {
                  if (!active || !payload?.length) return null;
                  const d = payload[0].payload;
                  return (
                    <div className="rounded-xl border border-slate-200 bg-white p-3 text-xs shadow-lg">
                      <p className="font-semibold text-slate-900">{d.label}</p>
                      {d.percentage == null ? (
                        <p className="mt-1 text-slate-400">No percentage exists</p>
                      ) : (
                        <p className="mt-1 text-slate-700">{d.percentage}%</p>
                      )}
                    </div>
                  );
                }}
                cursor={{ fill: "#EFF6FF" }}
              />
              <Bar
                dataKey="barValue"
                radius={[6, 6, 0, 0]}
                animationDuration={800}
                animationEasing="ease-out"
              >
                {chartData.map((entry, i) => (
                  <Cell
                    key={i}
                    fill={entry.percentage == null ? "#E2E8F0" : "#3B82F6"}
                  />
                ))}
                <LabelList
                  dataKey="percentage"
                  position="top"
                  formatter={(value) =>
                    value == null ? "No percentage exists" : `${value}%`
                  }
                  style={{ fontSize: 11, fill: "#64748B" }}
                />
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}
