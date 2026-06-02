from dataclasses import dataclass

@dataclass
class StudySubject:
    name: str
    hours_needed: float
    difficulty: int
    deadline_days: int

    @property
    def priority(self) -> float:
        # same idea as your PyQt: difficulty * (1 / max(deadline_days, 1))
        return self.difficulty / max(self.deadline_days, 1)
