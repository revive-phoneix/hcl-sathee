
const COMPULSORY_COURSE_SUBJECTS = {
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

const OPTIONAL_COURSE_SUBJECTS = {
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

function getCourseSubjectConfig(course) {
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
    };
  }

  return null;
}

function normalizeSubjects(value) {
  if (Array.isArray(value)) {
    return [
      ...new Set(
        value
          .filter((item) => typeof item === "string" && item.trim())
          .map((item) => item.trim())
      ),
    ];
  }

  if (value && typeof value === "object") {
    return normalizeSubjects(Object.keys(value));
  }

  if (typeof value === "string" && value.trim()) {
    try {
      return normalizeSubjects(JSON.parse(value));
    } catch {
      return [];
    }
  }

  return [];
}

function validateSubjectSelection(course, selectedSubjects) {
  const config = getCourseSubjectConfig(course);
  if (!config) {
    return { ok: false, message: "Please select a valid course." };
  }

  const selected = normalizeSubjects(selectedSubjects);
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

  // Keep compulsory first, then choices in selected order
  const ordered = [
    ...config.compulsory,
    ...choices.filter((s) => selected.includes(s)),
  ];

  return { ok: true, subjects: ordered };
}

function resolveSubjectsForCourse(course, subjects, marks, attendance) {
  const fromBody = normalizeSubjects(subjects);
  if (fromBody.length) {
    return validateSubjectSelection(course, fromBody);
  }

  const fromMaps = normalizeSubjects({
    ...((marks && typeof marks === "object" && !Array.isArray(marks) && marks) || {}),
    ...((attendance && typeof attendance === "object" && !Array.isArray(attendance) && attendance) || {}),
  });

  if (fromMaps.length) {
    return validateSubjectSelection(course, fromMaps);
  }

  const config = getCourseSubjectConfig(course);
  if (config?.type === "fixed") {
    return { ok: true, subjects: [...config.compulsory] };
  }

  return {
    ok: false,
    message: "Subjects are required for this course (select optional subjects).",
  };
}

module.exports = {
  COMPULSORY_COURSE_SUBJECTS,
  OPTIONAL_COURSE_SUBJECTS,
  getCourseSubjectConfig,
  normalizeSubjects,
  validateSubjectSelection,
  resolveSubjectsForCourse,
};
