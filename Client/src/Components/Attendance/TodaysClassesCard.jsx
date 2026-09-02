import { useEffect, useMemo, useState } from "react";
import { BookOpen, Clock, CalendarDays, ChevronDown } from "lucide-react";
import { loadTimetableForPortal } from "../../services/timetables";
import { getApiErrorMessage } from "../../utils/apiRequest";
import { getTodaysClasses } from "../../utils/todayClasses";

const formatTodayLabel = (date = new Date()) =>
  date.toLocaleDateString("en-IN", {
    weekday: "long",
    day: "numeric",
    month: "short",
    year: "numeric",
  });

export default function TodaysClassesCard({ portalName = "", isCustomCentre = false }) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [timetable, setTimetable] = useState(null);

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      // Skip loading for custom centres (no data yet)
      if (isCustomCentre) {
        setTimetable(null);
        setError("");
        setLoading(false);
        return;
      }

      setLoading(true);
      setError("");
      try {
        const { timetable: data } = await loadTimetableForPortal(portalName, {
          canMigrate: false,
        });
        if (!cancelled) setTimetable(data || null);
      } catch (err) {
        console.error("Today's classes load error:", err);
        if (!cancelled) {
          setTimetable(null);
          setError(getApiErrorMessage(err, "Unable to load timetable"));
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    load();
    return () => {
      cancelled = true;
    };
  }, [portalName, isCustomCentre]);

  const { day, classes, unsupported } = useMemo(
    () => getTodaysClasses(timetable),
    [timetable]
  );

  const isSunday = day === "Sunday";
  const summary = loading
    ? "Loading…"
    : error
      ? "Unable to load"
      : unsupported
        ? "Grid timetable required"
        : isSunday && classes.length === 0
          ? "No classes (Sunday)"
          : `${classes.length} class${classes.length === 1 ? "" : "es"}`;

  return (
    <section className="rounded-2xl border border-violet-200 bg-white shadow-sm overflow-hidden">
      <button
        type="button"
        onClick={() => setOpen((prev) => !prev)}
        aria-expanded={open}
        className="w-full flex flex-wrap items-center justify-between gap-3 bg-violet-50 px-5 py-4 text-left hover:bg-violet-100/80 transition-colors"
      >
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-xl bg-violet-100 flex items-center justify-center shrink-0">
            <BookOpen size={20} className="text-violet-600" />
          </div>
          <div className="min-w-0">
            <h2 className="text-lg font-semibold text-slate-900">Today&apos;s Classes</h2>
            <p className="text-xs text-slate-500 flex items-center gap-1.5 mt-0.5">
              <CalendarDays size={12} />
              {formatTodayLabel()} · {summary}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="inline-flex items-center rounded-full bg-white border border-violet-200 px-3 py-1 text-xs font-semibold text-violet-700">
            {day}
          </span>
          <ChevronDown
            size={20}
            className={`text-violet-600 transition-transform duration-200 ${
              open ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {open ? (
        <div className="border-t border-violet-100 px-5 py-4">
          {loading ? (
            <p className="py-6 text-center text-sm text-slate-500">
              Loading today&apos;s classes…
            </p>
          ) : error ? (
            <p className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </p>
          ) : unsupported ? (
            <p className="py-4 text-sm text-slate-600">
              Today&apos;s classes need an Excel weekly grid timetable (Mon–Sat columns).
              SVG uploads cannot be broken into class slots — upload a grid timetable from the dashboard.
            </p>
          ) : isSunday && !classes.length ? (
            <p className="py-4 text-sm text-slate-600">
              No centre classes scheduled for Sunday.
            </p>
          ) : !classes.length ? (
            <p className="py-4 text-sm text-slate-600">
              No classes found for {day} in the uploaded timetable.
              Upload or update the weekly timetable from the dashboard.
            </p>
          ) : (
            <ul className="space-y-3">
              {classes.map((item, index) => (
                <li
                  key={`${item.time}-${item.label}-${index}`}
                  className="flex flex-wrap items-start justify-between gap-3 rounded-xl border border-slate-200 bg-slate-50 px-4 py-3"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-slate-900">
                      {item.subject}
                    </p>
                    <p className="mt-0.5 text-xs text-slate-500">
                      {item.course
                        ? `Course: ${item.course}`
                        : "Course not specified — use e.g. “Mathematics - RRB” or “RRB - Mathematics”"}
                    </p>
                  </div>
                  {item.time ? (
                    <span className="inline-flex items-center gap-1.5 shrink-0 rounded-lg bg-white border border-slate-200 px-2.5 py-1 text-xs font-medium text-violet-700 tabular-nums">
                      <Clock size={12} />
                      {item.time}
                    </span>
                  ) : null}
                </li>
              ))}
            </ul>
          )}
        </div>
      ) : null}
    </section>
  );
}
