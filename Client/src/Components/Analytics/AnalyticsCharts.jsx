const CHART_HEIGHT = 240;

function buildYTicks(maxValue, tickCount = 4) {
  const safeMax = Math.max(Math.ceil(maxValue), 1);
  const step = Math.max(1, Math.ceil(safeMax / tickCount));
  const ticks = [];
  for (let v = 0; v <= safeMax; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== safeMax) ticks.push(safeMax);
  return Array.from(new Set(ticks)).sort((a, b) => b - a);
}

function buildPercentTicks(maxValue, count = 4) {
  const safeMax = Math.max(Math.ceil(maxValue), 1);
  const step = Math.max(1, Math.ceil(safeMax / count));
  const ticks = [];
  for (let v = 0; v <= safeMax; v += step) ticks.push(v);
  if (ticks[ticks.length - 1] !== safeMax) ticks.push(safeMax);
  return Array.from(new Set(ticks)).sort((a, b) => a - b);
}

export function EmptyDataCard({ title, message = "no data exists", subtitle = "" }) {
  return (
    <div className="rounded-2xl border border-dashed border-slate-300 bg-white px-6 py-10 text-center text-slate-500 shadow-sm">
      <p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">{title}</p>
      <p className="mt-3 text-base font-medium text-slate-500">{message}</p>
      {subtitle ? <p className="mt-2 text-sm text-slate-400">{subtitle}</p> : null}
    </div>
  );
}

export function BarChartCard({
  title,
  subtitle,
  items = [],
  emptyMessage = "no data exists",
  valueSuffix = "",
  valueFormatter = (value) => value,
  yAxisLabel = "Students",
  xAxisLabel = "Course",
}) {
  const numericValues = items.map((item) => Number(item?.value)).filter((v) => Number.isFinite(v));
  if (!items.length || !numericValues.length) {
    return <EmptyDataCard title={title} message={emptyMessage} subtitle={subtitle} />;
  }

  const maxValue = Math.max(...numericValues, 1);
  const yTicks = buildYTicks(maxValue, 4);
  const chartMax = yTicks[0] || maxValue;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="flex gap-3">
        {yAxisLabel ? (
          <div
            className="flex shrink-0 items-center justify-center text-[11px] font-semibold uppercase tracking-wider text-slate-500"
            style={{ writingMode: "vertical-rl", transform: "rotate(180deg)", width: 20 }}
          >
            {yAxisLabel}
          </div>
        ) : null}

        <div className="min-w-0 flex-1">
          <div className="flex" style={{ height: CHART_HEIGHT }}>
            <div className="relative mr-2 w-10 shrink-0">
              {yTicks.map((tick, index) => (
                <div
                  key={`${tick}-${index}`}
                  className="absolute right-0 flex w-full translate-y-1/2 items-center justify-end pr-2"
                  style={{ top: `${(index / (yTicks.length - 1)) * 100}%` }}
                >
                  <span className="text-[11px] font-medium tabular-nums text-slate-600">{tick}</span>
                </div>
              ))}
            </div>

            <div className="relative min-w-0 flex-1">
              {yTicks.map((tick, index) => (
                <div
                  key={`grid-${tick}-${index}`}
                  className="pointer-events-none absolute left-0 right-0 border-t border-slate-100"
                  style={{ top: `${(index / (yTicks.length - 1)) * 100}%` }}
                />
              ))}

              <div className="absolute inset-0 flex items-end gap-3 overflow-x-auto px-1 pb-0">
                {items.map((item) => {
                  const value = Number(item?.value);
                  const hasValue = Number.isFinite(value);
                  const barHeight = hasValue ? Math.max(4, Math.round((value / chartMax) * 100)) : 0;
                  const displayValue = hasValue ? `${valueFormatter(value)}${valueSuffix}` : emptyMessage;

                  return (
                    <div key={item.label} className="flex h-full min-w-[52px] flex-none flex-col items-center">
                      <div className="relative flex h-full w-10 items-end justify-center">
                        {hasValue ? (
                          <>
                            <div
                              className="absolute -top-4 text-[11px] font-semibold tabular-nums text-slate-700"
                              style={{ whiteSpace: "nowrap" }}
                            >
                              {displayValue}
                            </div>

                            <div
                              className="w-full min-h-[4px] rounded-t-md bg-gradient-to-t from-blue-600 to-cyan-400 shadow-sm transition-all duration-500"
                              style={{ height: `${barHeight}%` }}
                              title={`${item.label}: ${displayValue}`}
                            />
                          </>
                        ) : (
                          <div className="h-4 w-full rounded-md bg-slate-200" />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          <div className="mt-3 flex pl-12">
            <div className="flex min-w-0 flex-1 gap-3 overflow-x-auto px-1">
              {items.map((item) => (
                <div key={`${item.label}-x`} className="flex min-w-[52px] flex-none justify-center">
                  <p className="max-w-[72px] truncate text-center text-[11px] font-medium text-slate-700" title={item.label}>
                    {item.label}
                  </p>
                </div>
              ))}
            </div>
          </div>

          {xAxisLabel ? (
            <p className="mt-2 pl-12 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">{xAxisLabel}</p>
          ) : null}
        </div>
      </div>
    </section>
  );
}

export function BarListChart({
  title,
  subtitle,
  items = [],
  emptyMessage = "no data exists",
  valueSuffix = "",
  valueFormatter = (value) => value,
  xAxisLabel = "Value",
}) {
  const numericValues = items.map((item) => Number(item?.value)).filter((v) => Number.isFinite(v));
  if (!items.length || !numericValues.length) {
    return <EmptyDataCard title={title} message={emptyMessage} subtitle={subtitle} />;
  }

  const maxValue = Math.max(...numericValues, 1);
  const xTicks = buildPercentTicks(maxValue, 4);
  const scaleMax = xTicks[xTicks.length - 1] || maxValue;

  return (
    <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
      <div className="mb-5">
        <h2 className="text-lg font-bold text-slate-900">{title}</h2>
        {subtitle ? <p className="mt-1 text-sm text-slate-500">{subtitle}</p> : null}
      </div>

      <div className="mb-4 ml-[140px] mr-2 border-b border-slate-200 pb-2">
        <div className="relative h-4">
          {xTicks.map((tick) => (
            <div key={tick} className="absolute top-0 flex -translate-x-1/2 flex-col items-center" style={{ left: `${(tick / scaleMax) * 100}%` }}>
              <span className="text-[10px] font-medium tabular-nums text-slate-500">{tick}{valueSuffix}</span>
            </div>
          ))}
        </div>

        {xAxisLabel ? (
          <p className="mt-1 text-center text-[11px] font-semibold uppercase tracking-wider text-slate-500">{xAxisLabel}</p>
        ) : null}
      </div>

      <div className="space-y-5">
        {items.map((item) => {
          const value = Number(item?.value);
          const hasValue = Number.isFinite(value);
          const width = hasValue ? Math.max(4, Math.round((value / scaleMax) * 100)) : 0;
          const displayValue = hasValue ? `${valueFormatter(value)}${valueSuffix}` : emptyMessage;

          return (
            <div key={item.label} className="grid grid-cols-[132px_1fr] items-center gap-3">
              <span className="truncate text-right text-sm font-medium text-slate-700" title={item.label}>{item.label}</span>

              <div className="relative">
                <div className="pointer-events-none absolute inset-0">
                  {xTicks.slice(1, -1).map((tick) => (
                    <div key={`${item.label}-guide-${tick}`} className="absolute top-0 h-full w-px bg-slate-100" style={{ left: `${(tick / scaleMax) * 100}%` }} />
                  ))}
                </div>

                <div className="relative h-4 overflow-hidden rounded-full border border-slate-200 bg-slate-50">
                  {hasValue ? (
                    <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-cyan-400 transition-all duration-500" style={{ width: `${width}%` }} />
                  ) : (
                    <div className="h-full w-1/4 rounded-full bg-slate-200" />
                  )}
                </div>

                <div className="mt-1 flex items-center justify-between gap-2 text-xs">
                  <span className="text-slate-400">0{valueSuffix}</span>
                  <span className={hasValue ? "font-semibold text-slate-900" : "text-slate-400"}>{displayValue}</span>
                </div>

                {item.helper ? <p className="mt-0.5 text-xs text-slate-400">{item.helper}</p> : null}
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}
