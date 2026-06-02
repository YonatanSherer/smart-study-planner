import { useMemo, useState } from "react";
import { translations } from "./i18n";

const API_BASE = "http://localhost:8000";

/**
 * Normalize backend output:
 * { date: [[name, hours], ...] } -> [{ date, subject, hours }]
 */
function normalizePlan(raw) {
  if (!raw || typeof raw !== "object") return [];

  const out = [];
  Object.entries(raw).forEach(([date, tasks]) => {
    if (Array.isArray(tasks)) {
      tasks.forEach((task) => {
        if (Array.isArray(task)) {
          out.push({
            date,
            subject: task[0],
            hours: task[1],
          });
        }
      });
    }
  });
  return out;
}

function groupByDate(plan) {
  const grouped = {};
  plan.forEach((p) => {
    if (!grouped[p.date]) grouped[p.date] = [];
    grouped[p.date].push(p);
  });
  return grouped;
}

/* Progress bar color helper */
function getProgressColor(ratio) {
  if (ratio < 0.7) return "bg-emerald-500";
  if (ratio < 0.95) return "bg-amber-400";
  return "bg-red-500";
}

export default function App() {
  const [name, setName] = useState("");
  const [hours, setHours] = useState("");
  const [difficulty, setDifficulty] = useState(2);
  const [deadline, setDeadline] = useState("");

  const [subjects, setSubjects] = useState([]);
  const [editIndex, setEditIndex] = useState(null);

  const [hoursPerDay, setHoursPerDay] = useState("");

  const [plan, setPlan] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [expandedDays, setExpandedDays] = useState({});

  const canSubmit = useMemo(() => name.trim().length > 0, [name]);

  // User guide modal
  const [showGuide, setShowGuide] = useState(false);

  const [lang, setLang] = useState("en");
  const t = translations[lang];


  function resetForm() {
    setName("");
    setHours("");
    setDifficulty(2);
    setDeadline("");
    setEditIndex(null);
  }

  function addOrUpdate() {
    if (!canSubmit) return;

    const s = {
      name: name.trim(),
      hours_needed: Number(hours),
      difficulty: Number(difficulty),
      deadline_days: Number(deadline),
    };

    if (editIndex !== null) {
      const copy = [...subjects];
      copy[editIndex] = s;
      setSubjects(copy);
    } else {
      setSubjects([...subjects, s]);
    }

    resetForm();
  }

  /* ✅ NEW: delete subject */
  function deleteSubject(index) {
    setSubjects((prev) => prev.filter((_, i) => i !== index));

    // if deleting the one currently being edited
    if (editIndex === index) {
      resetForm();
    }
  }

  async function generatePlan() {
    if (!subjects.length) {
      setError("Add at least one subject first.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch(`${API_BASE}/generate-plan`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          subjects,
          hours_per_day: Number(hoursPerDay),
        }),
      });

      const data = await res.json();
      setPlan(normalizePlan(data.plan ?? data));
      setExpandedDays({});
    } catch (e) {
      setError("Failed to generate plan.");
    } finally {
      setLoading(false);
    }
  }

  const grouped = groupByDate(plan);

  function toggleDay(date) {
    setExpandedDays((prev) => ({
      ...prev,
      [date]: !prev[date],
    }));
  }

  const allExpanded =
    Object.keys(grouped).length > 0 &&
    Object.keys(grouped).every((d) => expandedDays[d] ?? true);

  function expandAllDays() {
    const next = {};
    Object.keys(grouped).forEach((d) => (next[d] = true));
    setExpandedDays(next);
  }

  function collapseAllDays() {
    const next = {};
    Object.keys(grouped).forEach((d) => (next[d] = false));
    setExpandedDays(next);
  }

  return (
    <div
  dir={lang === "he" ? "rtl" : "ltr"}
  className="min-h-screen bg-gradient-to-br from-slate-100 to-slate-200 px-6 py-8"
>

      <div className="max-w-5xl mx-auto">

        {/* Header */}
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-slate-900">
            {t.title}
          </h1>
          <p className="text-sm text-slate-500">
            {t.subtitle}
          </p>

          <div className="flex justify-center gap-4 text-sm mt-2">
  <button
    onClick={() => setLang("en")}
    className={lang === "en" ? "font-bold underline" : ""}
  >
    EN
  </button>
  <button
    onClick={() => setLang("he")}
    className={lang === "he" ? "font-bold underline" : ""}
  >
    עברית
  </button>
</div>

          <button
  onClick={() => setShowGuide(true)}
  className="text-sm text-emerald-600 hover:underline"
>
  📘 {t.userGuide}
</button>

        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

          {/* LEFT COLUMN */}
          <div className="space-y-4">

            {/* Add Subject */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase text-slate-600">
                {t.addSubject}
              </h2>

              <input
                className="w-full border rounded-lg px-3 py-2 text-sm"
                placeholder={t.subjectName}
                value={name}
                onChange={(e) => setName(e.target.value)}
              />

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={t.hoursplaceholder}
                    value={hours}
                    onChange={(e) => setHours(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t.hours}
                  </p>
                </div>

                <div>
                  <input
                    type="number"
                    className="w-full border rounded-lg px-3 py-2 text-sm"
                    placeholder={t.daysplaceholder}
                    value={deadline}
                    onChange={(e) => setDeadline(e.target.value)}
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    {t.deadline}
                  </p>
                </div>
              </div>

              <div>
                <select
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value)}
                >
                  <option value={1}>{t.easy}</option>
                  <option value={2}>{t.medium}</option>
                  <option value={3}>{t.hard}</option>
                </select>
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.difficulty}
                </p>
              </div>

              <button
                onClick={addOrUpdate}
                className="w-full bg-slate-900 text-white py-2 rounded-lg text-sm"
              >
                {editIndex !== null ? t.updateSubject : t.addSubject}
              </button>
            </div>

            {/* Subjects */}
            {subjects.length > 0 && (
              <div className="bg-white rounded-xl shadow p-4 space-y-2">
                <h2 className="text-xs font-semibold uppercase text-slate-600">
                  {t.subjects}
                </h2>

                <div className="flex flex-wrap gap-2">
                  {subjects.map((s, i) => (
                    <div
                      key={i}
                      className="flex items-center gap-2 bg-slate-100 border rounded-full px-3 py-1.5 text-xs"
                    >
                      <span className="font-medium">{s.name}</span>

                      <span className="text-slate-500">
                        {s.hours_needed}h · diff {s.difficulty}
                      </span>

                      <button
                        onClick={() => {
                          setName(s.name);
                          setHours(s.hours_needed);
                          setDifficulty(s.difficulty);
                          setDeadline(s.deadline_days);
                          setEditIndex(i);
                        }}
                        className="text-emerald-600 hover:underline"
                      >
                        Edit
                      </button>

                      {/* ✅ Delete */}
                      <button
                        onClick={() => deleteSubject(i)}
                        className="text-red-500 hover:text-red-700 font-bold"
                        title={t.delete}
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN */}
          <div className="space-y-4">

            {/* Generate */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3">
              <h2 className="text-xs font-semibold uppercase text-slate-600">
                {t.generatePlanButton}
              </h2>

              <div>
                <input
                  type="number"
                  className="w-full border rounded-lg px-3 py-2 text-sm"
                  value={hoursPerDay}
                  onChange={(e) => setHoursPerDay(e.target.value)}
                  placeholder={t.hoursPerDay}
                />
                <p className="text-[11px] text-slate-500 mt-1">
                  {t.maxHoursPerDay}
                </p>
              </div>

              <button
                onClick={generatePlan}
                disabled={loading}
                className="w-full bg-emerald-600 text-white py-2 rounded-lg text-sm"
              >
                {loading ? t.loading : t.generatePlan}
              </button>

              {error && (
                <p className="text-red-600 text-xs">{error}</p>
              )}
            </div>

            {/* Study Plan */}
            <div className="bg-white rounded-xl shadow p-4 space-y-3 max-h-[460px] overflow-y-auto">
              <div className="flex justify-between items-center">
                <h2 className="text-xs font-semibold uppercase text-slate-600">
                  {t.studyPlan}
                </h2>

                {Object.keys(grouped).length > 0 && (
                  <button
                    onClick={allExpanded ? collapseAllDays : expandAllDays}
                    className="text-xs text-emerald-600 hover:underline"
                  >
                    {allExpanded ? t.collapseAll : t.expandAll}
                  </button>
                )}
              </div>

              {Object.entries(grouped).map(([date, items]) => {
                const totalHours = items.reduce(
                  (sum, i) => sum + i.hours,
                  0
                );
                const ratio = Math.min(
                  totalHours / hoursPerDay,
                  1
                );
                const expanded = expandedDays[date] ?? true;

                return (
                  <div
                    key={date}
                    className="border rounded-lg p-3 bg-slate-50"
                  >
                    <button
                      onClick={() => toggleDay(date)}
                      className="w-full flex justify-between items-center text-left"
                    >
                      <span className="text-sm font-semibold text-slate-700">
                        {expanded ? "▾" : "▸"}{" "}
                        {new Date(date).toLocaleDateString(undefined, {
                          weekday: "short",
                          month: "short",
                          day: "numeric",
                        })}
                      </span>

                      <span className="text-xs text-slate-500">
                        {totalHours.toFixed(1)} / {hoursPerDay}h
                      </span>
                    </button>

                    {expanded && (
                      <div className="space-y-2 mt-2">
                        <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                          <div
                            className={`h-full ${getProgressColor(
                              ratio
                            )}`}
                            style={{ width: `${ratio * 100}%` }}
                          />
                        </div>

                        <div className="space-y-1">
                          {items.map((it, idx) => (
                            <div
                              key={idx}
                              className="flex justify-between text-xs bg-white border rounded px-2 py-1"
                            >
                              <span className="font-medium">
                                {it.subject}
                              </span>
                              <span className="text-slate-500">
                                {it.hours}h
                              </span>
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

          </div>
        </div>
      </div>


      {showGuide && (
  <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
    <div className="bg-white max-w-lg w-full rounded-xl shadow-lg p-6 relative">
      <button
        onClick={() => setShowGuide(false)}
        className="absolute top-3 right-3 text-slate-500 hover:text-slate-700"
      >
        ✕
      </button>

      <h2 className="text-lg font-bold mb-4">
        {t.userGuideTitle}
      </h2>

      <ul className="text-sm space-y-2 list-disc pl-5">
  {t.userGuideItems.map((line, i) => (
    <li key={i}>{line}</li>
  ))}
</ul>
    </div>
  </div>
)}



    </div>
  );
}
