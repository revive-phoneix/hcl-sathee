import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createEquipment, fetchEquipments } from "../../services/equipment";
import { matchesPortalCentre } from "../../utils/portalMapping";
import AddEquipmentModal from "./AddEquipmentModal";

export default function UtilitiesSection({ portalName, readOnly = false }) {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadEquipments = async () => {
    setLoading(true);
    setError("");
    try {
      setEquipments(await fetchEquipments());
    } catch (err) {
      console.error("Fetch equipments error:", err);
      setError(err.response?.data?.message || "Unable to load utilities");
      setEquipments([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadEquipments();
  }, []);

  const rows = useMemo(
    () =>
      equipments.filter((item) =>
        matchesPortalCentre(item.centre, portalName)
      ),
    [equipments, portalName]
  );

  const handleAdd = async (payload) => {
    setSubmitting(true);
    try {
      const saved = await createEquipment(payload);
      setEquipments((prev) => [saved, ...prev]);
      setModalOpen(false);
    } catch (err) {
      throw new Error(
        err.response?.data?.message || "Unable to save equipment"
      );
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <div className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-5 border-b border-gray-100 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h2 className="text-base font-bold text-gray-900">Utilities</h2>
            <p className="text-sm text-gray-500">
              Centre equipment inventory
            </p>
          </div>
          {!readOnly ? (
            <button
              type="button"
              onClick={() => setModalOpen(true)}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-lg bg-blue-600 text-white text-sm font-semibold hover:bg-blue-700 transition-colors shadow-sm"
            >
              <Plus size={16} />
              Add Equipment
            </button>
          ) : null}
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ backgroundColor: "#CCD2DD" }}>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Equipment Name
                </th>
                <th className="text-left px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Description
                </th>
                <th className="text-center px-4 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Quantity
                </th>
                <th className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase">
                  Serial Number
                </th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    Loading utilities…
                  </td>
                </tr>
              ) : error ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-red-500"
                  >
                    {error}
                  </td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="px-5 py-10 text-center text-sm text-gray-400"
                  >
                    No equipment added for this centre yet.
                  </td>
                </tr>
              ) : (
                rows.map((item, i) => (
                  <tr
                    key={item.id}
                    className={`hover:bg-blue-50 ${
                      i % 2 === 0 ? "bg-white" : "bg-gray-50/50"
                    }`}
                  >
                    <td className="px-5 py-4 font-semibold text-gray-900">
                      {item.name}
                    </td>
                    <td className="px-4 py-4 text-gray-600 max-w-md">
                      {item.description}
                    </td>
                    <td className="px-4 py-4 text-center font-medium text-gray-700 tabular-nums">
                      {item.quantity}
                    </td>
                    <td className="px-5 py-4 text-gray-600">
                      {item.serialNumber || "—"}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {!readOnly ? (
        <AddEquipmentModal
          open={modalOpen}
          onClose={() => setModalOpen(false)}
          onSubmit={handleAdd}
          submitting={submitting}
          portalName={portalName}
        />
      ) : null}
    </>
  );
}
