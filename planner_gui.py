import sys
import datetime
from PyQt6.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QLabel,
    QLineEdit, QPushButton, QTableWidget, QTableWidgetItem,
    QTextEdit, QComboBox, QSpinBox
)
from PyQt6.QtCore import Qt


# --------------------------------------
# STUDY SUBJECT DATA CLASS
# --------------------------------------
class StudySubject:
    def __init__(self, name, hours_needed, difficulty, deadline_days):
        self.name = name
        self.hours_needed = hours_needed
        self.difficulty = difficulty
        self.deadline_days = deadline_days
        self.priority = difficulty * (1 / max(deadline_days, 1))


# --------------------------------------
# CORE SCHEDULING LOGIC
# --------------------------------------
def generate_study_plan(subjects, hours_per_day):
    today = datetime.date.today()
    plan = {}

    subjects_sorted = sorted(subjects, key=lambda s: s.priority, reverse=True)

    for subj in subjects_sorted:
        days_available = max(subj.deadline_days, 1)
        hours_per_day_for_subject = subj.hours_needed / days_available

        for day_offset in range(days_available):
            date = today + datetime.timedelta(days=day_offset)

            if date not in plan:
                plan[date] = []

            plan[date].append((subj.name, round(hours_per_day_for_subject, 1)))

    final_plan = {}

    for date, tasks in plan.items():
        total_hours = sum(hours for _, hours in tasks)

        if total_hours > hours_per_day:
            scale = hours_per_day / total_hours
            tasks = [(name, round(hours * scale, 1)) for name, hours in tasks]

        final_plan[date] = tasks

    return final_plan


# --------------------------------------
# MAIN GUI APPLICATION
# --------------------------------------
class StudyPlannerGUI(QWidget):
    def __init__(self):
        super().__init__()

        self.subjects = []

        self.setWindowTitle("Smart Study Planner (PyQt6)")
        self.setFixedSize(1200, 700)
        self.setGeometry(300, 200, 800, 600)

        layout = QVBoxLayout()

        # ------------------------------
        # INPUT FIELDS
        # ------------------------------
        input_layout = QHBoxLayout()

        self.name_input = QLineEdit()
        self.name_input.setPlaceholderText("Subject name")

        self.hours_input = QSpinBox()
        self.hours_input.setRange(1, 100)
        self.hours_input.setPrefix("Hours: ")

        self.difficulty_input = QComboBox()
        self.difficulty_input.addItems(["Easy (1)", "Medium (2)", "Hard (3)"])

        self.deadline_input = QSpinBox()
        self.deadline_input.setRange(1, 30)
        self.deadline_input.setPrefix("Deadline days: ")

        add_btn = QPushButton("Add Subject")
        add_btn.clicked.connect(self.add_subject)

        input_layout.addWidget(self.name_input)
        input_layout.addWidget(self.hours_input)
        input_layout.addWidget(self.difficulty_input)
        input_layout.addWidget(self.deadline_input)
        input_layout.addWidget(add_btn)

        layout.addLayout(input_layout)

        # ------------------------------
        # TABLE OF SUBJECTS
        # ------------------------------
        self.table = QTableWidget()
        self.table.setColumnCount(4)
        self.table.setHorizontalHeaderLabels(["Subject", "Hours", "Difficulty", "Deadline"])
        self.table.horizontalHeader().setStretchLastSection(True)

        layout.addWidget(self.table)

        # ------------------------------
        # HOURS PER DAY INPUT
        # ------------------------------
        hp_layout = QHBoxLayout()

        self.hours_per_day_input = QSpinBox()
        self.hours_per_day_input.setRange(1, 12)
        self.hours_per_day_input.setPrefix("Max hours/day: ")

        generate_btn = QPushButton("Generate Study Plan")
        generate_btn.clicked.connect(self.generate_plan)

        hp_layout.addWidget(self.hours_per_day_input)
        hp_layout.addWidget(generate_btn)

        layout.addLayout(hp_layout)

        # ------------------------------
        # OUTPUT AREA
        # ------------------------------
        self.output = QTextEdit()
        self.output.setReadOnly(True)
        layout.addWidget(self.output)

        self.setLayout(layout)

    # --------------------------------------
    # ADD SUBJECT TO TABLE
    # --------------------------------------
    def add_subject(self):
        name = self.name_input.text()
        hours = self.hours_input.value()
        diff_index = self.difficulty_input.currentIndex()
        difficulty = diff_index + 1
        deadline = self.deadline_input.value()

        if name == "":
            return

        subj = StudySubject(name, hours, difficulty, deadline)
        self.subjects.append(subj)

        row = self.table.rowCount()
        self.table.insertRow(row)

        self.table.setItem(row, 0, QTableWidgetItem(name))
        self.table.setItem(row, 1, QTableWidgetItem(str(hours)))
        self.table.setItem(row, 2, QTableWidgetItem(str(difficulty)))
        self.table.setItem(row, 3, QTableWidgetItem(str(deadline)))

        self.name_input.clear()

    # --------------------------------------
    # GENERATE STUDY PLAN
    # --------------------------------------
    def generate_plan(self):
        hours_per_day = self.hours_per_day_input.value()

        if not self.subjects:
            self.output.setText("No subjects added!")
            return

        plan = generate_study_plan(self.subjects, hours_per_day)

        text = "📅 Study Plan\n\n"
        for date, tasks in plan.items():
            text += f"{date}:\n"
            for name, hours in tasks:
                text += f"  • {name}: {hours}h\n"
            text += "\n"

        self.output.setText(text)


# --------------------------------------
# RUN APPLICATION
# --------------------------------------
if __name__ == "__main__":
    app = QApplication(sys.argv)

    # Set global font size
    font = app.font()
    font.setPointSize(16)  # ⬅️ increase number for bigger text
    app.setFont(font)

    window = StudyPlannerGUI()
    window.show()
    sys.exit(app.exec())
