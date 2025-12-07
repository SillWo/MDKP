from io import BytesIO

from flask import Flask, jsonify, render_template, request, send_file
from docx import Document
from security_logic import determine_level, get_base_requirements, get_measures_for_level

app = Flask(__name__)


def safe_filename(name: str) -> str:
    cleaned = "".join(ch for ch in (name or "") if ch.isalnum() or ch in (" ", "-", "_", "."))
    cleaned = cleaned.strip() or "Отчет ИСПДн"
    if not cleaned.lower().endswith(".docx"):
        cleaned += ".docx"
    return cleaned


@app.route("/")
def index():
    return render_template("index.html")


@app.route("/evaluate", methods=["POST"])
def evaluate():
    payload = request.get_json(force=True)
    data_type = payload.get("dataType")
    threats = payload.get("threats", [])
    employees_only = payload.get("employeesOnly", False)
    non_employee_scope = payload.get("nonEmployeeScope")

    if not employees_only and not non_employee_scope:
        non_employee_scope = "over_100k"

    unknown_threats = "unknown" in threats

    def build_levels_for_unknown():
        possibilities = []
        for threat_type in ("1", "2", "3"):
            lvl = determine_level(data_type, [threat_type], employees_only, non_employee_scope)
            possibilities.append({"threatType": threat_type, "level": lvl})
        return possibilities

    if unknown_threats:
        possible_levels = build_levels_for_unknown()
        max_level = max((item["level"] for item in possible_levels), default=4)
        return jsonify(
            {
                "level": max_level,
                "possibleLevels": possible_levels,
                "unknownThreats": True,
                "baseRequirements": [],
                "measures": [],
            }
        )

    level = determine_level(data_type, threats, employees_only, non_employee_scope)
    base_requirements = get_base_requirements(level)
    measures = get_measures_for_level(level)

    return jsonify(
        {
            "level": level,
            "baseRequirements": base_requirements,
            "measures": [
                {
                    "code": measure.code,
                    "section": measure.section,
                    "description": measure.description,
                }
                for measure in measures
            ],
        }
    )


@app.route("/export", methods=["POST"])
def export_report():
    payload = request.get_json(force=True) or {}
    file_name = safe_filename(payload.get("fileName", "Отчет ИСПДн"))
    answers = payload.get("payload", {})

    data_type = answers.get("dataType")
    threats = answers.get("threats", [])
    employees_only = answers.get("employeesOnly", False)
    non_employee_scope = answers.get("nonEmployeeScope")

    if not employees_only and not non_employee_scope:
        non_employee_scope = "over_100k"

    unknown_threats = "unknown" in threats

    def build_levels_for_unknown():
        possibilities = []
        for threat_type in ("1", "2", "3"):
            lvl = determine_level(data_type, [threat_type], employees_only, non_employee_scope)
            possibilities.append({"threatType": threat_type, "level": lvl})
        return possibilities

    doc = Document()
    doc.add_heading("Отчет по защищенности ИСПДн", level=1)

    if unknown_threats:
        possible_levels = build_levels_for_unknown()
        doc.add_paragraph("Тип актуальных угроз выбран как «не известен».")
        doc.add_heading("Возможные уровни защищенности", level=2)
        for item in possible_levels:
            doc.add_paragraph(
                f"Угрозы {item['threatType']} типа: уровень {item['level']}", style="List Bullet"
            )
        doc.add_paragraph(
            "Для уточнения уровня защищенности закажите услугу специалиста по определению типа актуальных угроз, "
            "после этого выполните перерасчет."
        )
    else:
        level = determine_level(data_type, threats, employees_only, non_employee_scope)
        base_requirements = get_base_requirements(level)
        measures = get_measures_for_level(level)

        doc.add_paragraph(f"Уровень защищенности: {level}")
        doc.add_paragraph("")

        doc.add_heading("Организационные требования", level=2)
        for req in base_requirements:
            doc.add_paragraph(req, style="List Bullet")

        doc.add_heading("Базовый набор мер", level=2)
        for measure in measures:
            doc.add_paragraph(f"{measure.code} — {measure.section}", style="List Bullet")
            doc.add_paragraph(measure.description)

    buffer = BytesIO()
    doc.save(buffer)
    buffer.seek(0)

    return send_file(
        buffer,
        as_attachment=True,
        download_name=file_name,
        mimetype="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    )


if __name__ == "__main__":
    app.run(host="0.0.0.0", port=5000, debug=True)
