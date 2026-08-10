import api from "./apiClient";

export const fetchTests = async (course, centre = "") => {
  const response = await api.get("/api/test-marks/tests", {
    params: { course, ...(centre ? { centre } : {}) },
  });
  return response.data.tests ?? [];
};

export const createTest = async ({ name, course, centre, testDate }) => {
  const response = await api.post("/api/test-marks/tests", { name, course, centre, testDate });
  return response.data.test;
};

export const ocrPrefillTestMarks = async (answerSheetFile) => {
  const formData = new FormData();
  formData.append("answerSheet", answerSheetFile);
  const response = await api.post("/api/test-marks/ocr-prefill", formData);
  return response.data; // { available, marks, rawText, message }
};

export const saveTestMarks = async ({ testId, studentId, course, centre, records, answerSheetFile }) => {
  const formData = new FormData();
  formData.append("testId", testId);
  formData.append("studentId", studentId);
  formData.append("course", course || "");
  formData.append("centre", centre || "");
  formData.append("records", JSON.stringify(records || []));
  if (answerSheetFile) formData.append("answerSheet", answerSheetFile);

  const response = await api.post("/api/test-marks", formData);
  return response.data;
};

export const documentPrefillTestMarks = async (answerSheetFile) => {
  const formData = new FormData();
  formData.append("answerSheet", answerSheetFile);
  const response = await api.post("/api/test-marks/document-prefill", formData);
  return response.data;
};

export const fetchCourseProgress = async (course, centre = "") => {
  const response = await api.get("/api/test-marks/course-progress", {
    params: { course, ...(centre ? { centre } : {}) },
  });
  return response.data.timeline ?? [];
};