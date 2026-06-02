import datetime
from typing import Dict, List, Tuple
from .models import StudySubject

Plan = Dict[str, List[Tuple[str, float]]]  # date string -> [(subject, hours)]

def generate_study_plan(subjects: List[StudySubject], hours_per_day: float) -> Plan:
    today = datetime.date.today()
    plan: Dict[datetime.date, List[Tuple[str, float]]] = {}

    subjects_sorted = sorted(subjects, key=lambda s: s.priority, reverse=True)

    for subj in subjects_sorted:
        days_available = max(subj.deadline_days, 1)
        hours_per_day_for_subject = subj.hours_needed / days_available

        for day_offset in range(days_available):
            date = today + datetime.timedelta(days=day_offset)
            plan.setdefault(date, [])
            plan[date].append((subj.name, round(hours_per_day_for_subject, 1)))

    final_plan: Plan = {}
    for date, tasks in plan.items():
        total_hours = sum(hours for _, hours in tasks)

        if total_hours > hours_per_day:
            scale = hours_per_day / total_hours
            tasks = [(name, round(hours * scale, 1)) for name, hours in tasks]

        # convert date -> ISO string for JSON
        final_plan[date.isoformat()] = tasks

    return final_plan
