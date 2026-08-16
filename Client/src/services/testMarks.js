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

export const deleteTest = async (id) => {
  const response = await api.delete(`/api/test-marks/tests/${id}`);
  return response.data;
};

export const saveTestMarks = async ({ testId, testType, studentId, course, centre, records, answerSheetFile }) => {
  const formData = new FormData();
  formData.append("testId", testId);
  formData.append("testType", testType || "performance");
  formData.append("studentId", studentId);
  formData.append("course", course || "");
  formData.append("centre", centre || "");
  formData.append("records", JSON.stringify(records || []));
  if (answerSheetFile) formData.append("answerSheet", answerSheetFile);

  const response = await api.post("/api/test-marks", formData);
  return response.data;
};

export const fetchCourseProgress = async (course, centre = "") => {
  const response = await api.get("/api/test-marks/course-progress", {
    params: { course, ...(centre ? { centre } : {}) },
  });
  return response.data.timeline ?? [];
};

export const fetchTestTypeProgress = async (course, testType, centre) => {
  const response = await api.get("/api/test-marks/test-type-progress", {
    params: { course, testType, ...(centre ? { centre } : {}) },
  });
  return response.data;
};