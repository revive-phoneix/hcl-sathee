/** Curriculum rules: compulsory vs choice subjects per course. */

export const COMPULSORY_COURSE_SUBJECTS = {
  JEE: ["Physics", "Chemistry", "Mathematics"],
  NEET: ["Physics", "Chemistry", "Biology"],
  SSC: [
    "Quantitative Aptitude",
    "Reasoning Ability",
    "English Language",
    "General Awareness",
  ],
  CLAT: [
    "English Language",
    "Current Affairs & General Knowledge",
    "Legal Reasoning",
    "Logical Reasoning",
    "Quantitative Techniques",
  ],
  IBPS: [
    "Quantitative Aptitude",
    "Reasoning Ability",
    "English Language",
    "General Awareness",
    "Computer Knowledge",
  ],
  RRB: [
    "Mathematics",
    "General Intelligence & Reasoning",
    "General Science",
    "General Awareness",
    "Current Affairs",
  ],
};

export const OPTIONAL_COURSE_SUBJECTS = {
  ICAR: {
    compulsory: ["Physics", "Chemistry"],
    chooseAnyOne: ["Mathematics", "Biology", "Agriculture"],
  },
  CUET: {
    compulsory: ["Language", "General Test"],
    domainSubjects: [
      "Physics",
      "Chemistry",
      "Mathematics",
      "Biology",
      "Agriculture",
      "Accountancy",
      "Business Studies",
      "Economics",
      "History",
      "Political Science",
      "Geography",
      "Psychology",
      "Sociology",
      "Computer Science",
      "Informatics Practices",
      "Physical Education",
      "Fine Arts",
      "Home Science",
      "Entrepreneurship",
    ],
  },
};

export const COURSE_SUBJECT_LIMITS = {
  JEE: { total: 3 },
  NEET: { total: 3 },
  SSC: { total: 4 },
  CLAT: { total: 5 },
  IBPS: { total: 5 },
  ICAR: { total: 3 },
  CUET: { min: 3, max: 8 },
  RRB: { total: 5 },
};

/**
 * @returns {{
 *   type: 'fixed' | 'choice',
 *   compulsory: string[],
 *   choice: string[],
 *   choiceMode: 'none' | 'exactlyOne' | 'range',
 *   minChoice: number,
 *   maxChoice: number,
 *   hint: string,
 * } | null}
 */
export function getCourseSubjectConfig(course) {
  if (!course) return null;

  if (COMPULSORY_COURSE_SUBJECTS[course]) {
    const subjects = COMPULSORY_COURSE_SUBJECTS[course];
    return {
      type: "fixed",
      compulsory: subjects,
      choice: [],
      choiceMode: "none",
      minChoice: 0,
      maxChoice: 0,
      hint: `All ${subjects.length} subjects are compulsory for ${course}.`,
    };
  }

  const optional = OPTIONAL_COURSE_SUBJECTS[course];
  if (!optional) return null;

  if (optional.chooseAnyOne) {
    return {
      type: "choice",
      compulsory: optional.compulsory,
      choice: optional.chooseAnyOne,
      choiceMode: "exactlyOne",
      minChoice: 1,
      maxChoice: 1,
      hint: "Select exactly 1 optional subject (Mathematics / Biology / Agriculture).",
    };
  }

  if (optional.domainSubjects) {
    return {
      type: "choice",
      compulsory: optional.compulsory,
      choice: optional.domainSubjects,
      choiceMode: "range",
      minChoice: 1,
      maxChoice: 6,
      hint: "Select 1–6 domain subjects (total subjects must be between 3 and 8).",
    };
  }

  return null;
}

export function buildMarksAndAttendance(subjects) {
  const marks = {};
  const attendance = {};
  for (const subject of subjects) {
    marks[subject] = 0;
    attendance[subject] = 0;
  }
  return { marks, attendance };
}

export function validateSubjectSelection(course, selectedSubjects) {
  const config = getCourseSubjectConfig(course);
  if (!config) {
    return { ok: false, message: "Please select a valid course." };
  }

  const selected = Array.isArray(selectedSubjects) ? selectedSubjects : [];
  const missingCompulsory = config.compulsory.filter((s) => !selected.includes(s));
  if (missingCompulsory.length) {
    return {
      ok: false,
      message: `Compulsory subjects missing: ${missingCompulsory.join(", ")}`,
    };
  }

  const choices = selected.filter((s) => !config.compulsory.includes(s));

  if (config.choiceMode === "exactlyOne") {
    if (choices.length !== 1) {
      return { ok: false, message: "Please select exactly one optional subject." };
    }
    if (!config.choice.includes(choices[0])) {
      return { ok: false, message: "Invalid optional subject selected." };
    }
  }

  if (config.choiceMode === "range") {
    if (choices.length < config.minChoice || choices.length > config.maxChoice) {
      return {
        ok: false,
        message: `Please select between ${config.minChoice} and ${config.maxChoice} domain subjects.`,
      };
    }
    if (choices.some((s) => !config.choice.includes(s))) {
      return { ok: false, message: "One or more selected domain subjects are invalid." };
    }
  }

  if (config.choiceMode === "none" && choices.length > 0) {
    return { ok: false, message: "This course does not allow optional subjects." };
  }

  return { ok: true };
}
