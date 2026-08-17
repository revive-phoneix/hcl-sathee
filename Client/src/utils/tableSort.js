const getStringValue = (value) => String(value ?? "").trim();

const getNameValue = (row) => {
  const direct =
    row?.name ||
    row?.title ||
    row?.fullName ||
    row?.studentName ||
    row?.firstName && `${row.firstName} ${row.lastName || ""}`.trim() ||
    "";

  return getStringValue(direct);
};

const getDateValue = (row) => {
  const dateSource =
    row?.created_at ||
    row?.createdAt ||
    row?.updated_at ||
    row?.updatedAt ||
    row?.postedOn ||
    row?.dateAdded ||
    row?.fromDate ||
    row?.toDate ||
    row?.date ||
    row?.created ||
    "";

  if (!dateSource) return Number.NEGATIVE_INFINITY;
  const parsed = Date.parse(dateSource);
  return Number.isNaN(parsed) ? Number.NEGATIVE_INFINITY : parsed;
};

export const sortTableRows = (rows = [], { sortBy = "name", direction = "asc" } = {}) => {
  const directionValue = direction === "desc" ? -1 : 1;

  return [...rows].sort((left, right) => {
    if (sortBy === "date") {
      return (getDateValue(left) - getDateValue(right)) * directionValue;
    }

    const leftName = getNameValue(left).toLocaleLowerCase();
    const rightName = getNameValue(right).toLocaleLowerCase();
    const nameComparison = leftName.localeCompare(rightName, undefined, {
      numeric: true,
      sensitivity: "base",
    });

    return nameComparison * directionValue;
  });
};
