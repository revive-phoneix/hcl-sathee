const { getSupabase, assertNoError } = require("../config/supabase");
const { toDate } = require("../Utils/firestoreHelpers");

const TABLE = "equipments";

const toApiEquipment = (row) => {
  if (!row) return null;
  return {
    id: row.id,
    name: row.name ?? "",
    description: row.description ?? "",
    quantity: Number(row.quantity) || 0,
    serialNumber: row.serial_number ?? null,
    centre: row.centre ?? null,
    created_at: toDate(row.created_at),
    updated_at: toDate(row.updated_at),
  };
};

const findAll = async () => {
  const { data, error } = await getSupabase()
    .from(TABLE)
    .select("*")
    .order("created_at", { ascending: false });
  assertNoError(error, "Failed to list equipment");
  return (data || []).map(toApiEquipment);
};

const findById = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).select("*").eq("id", id).maybeSingle();
  assertNoError(error, "Failed to find equipment");
  return toApiEquipment(data);
};

const create = async (data) => {
  const payload = {
    name: data.name,
    description: data.description,
    quantity: Number(data.quantity) || 0,
    serial_number: data.serialNumber ?? null,
    centre: data.centre ?? null,
  };

  const { data: row, error } = await getSupabase().from(TABLE).insert(payload).select("*").single();
  assertNoError(error, "Failed to create equipment");
  return toApiEquipment(row);
};

const destroy = async (id) => {
  const { data, error } = await getSupabase().from(TABLE).delete().eq("id", id).select("id");
  assertNoError(error, "Failed to delete equipment");
  return data && data.length ? 1 : 0;
};

module.exports = {
  findAll,
  findById,
  create,
  destroy,
};
