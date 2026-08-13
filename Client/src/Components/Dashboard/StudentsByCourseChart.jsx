import { useMemo } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell,
} from "recharts";

const COURSES = ["JEE", "NEET", "SSC", "CLAT", "IBPS", "ICAR", "CUET", "RRB"];
const BAR_COLOR = "#3B82F6";

function CustomTooltip({ active, payload }) {
  if (!active || !payload?.length) return null;
  const { course, names } = payload[0].payload;
  return (
    <div className="max-w-xs rounded-xl border border-slate-200 bg-white p-3 shadow-lg">
      <p className="text-xs font-semibold uppercase tracking-wide text-slate-500">{course}</p>
      <p className="mt-1 text-sm font-semibold text-slate-900">
        {names.length} student{names.length === 1 ? "" : "s"}
      </p>
      {names.length ? (
        <ul className="mt-2 max-h-40 space-y-0.5 overflow-y-auto text-xs text-slate-600">
          {names.map((name, i) => (
            <li key={i}>{name}</li>
          ))}
        </ul>
      ) : (
        <p className="mt-2 text-xs text-slate-400">No students enrolled yet</p>
      )}
    </div>
  );
}

export function StudentsByCourseChart({ students = [], loading = false }) {
  const data = useMemo(() => {
    return COURSES.map((course) => {
      const matches = students.filter(
        (s) => String(s.course || "").trim().toUpperCase() === course
      );
      return {
        course,
        count: matches.length,
        names: matches.map((s) => s.name).filter(Boolean),
      };
    });
  }, [students]);

  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <div className="rounded-3xl border border-slate-200 bg-white p-6 h-[280px] flex flex-col">
      <div>
        <p className="text-sm font-semibold text-slate-900">Students by Course</p>
        <p className="text-xs text-slate-500">
          Total {total.toLocaleString("en-IN")} students &middot; hover a bar to see names
        </p>
      </div>

      <div className="mt-3 flex-1">
        {loading ? (
          <div className="flex h-full items-center justify-center text-sm text-slate-400">
            Loading…
          </div>
        ) : (
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data} margin={{ top: 8, right: 8, left: -20, bottom: 0 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
              <XAxis dataKey="course" tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11, fill: "#64748B" }} axisLine={false} tickLine={false} />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: "#EFF6FF" }} />
              <Bar dataKey="count" radius={[6, 6, 0, 0]} animationDuration={800} animationEasing="ease-out">
                {data.map((entry) => (
                  <Cell key={entry.course} fill={BAR_COLOR} />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}