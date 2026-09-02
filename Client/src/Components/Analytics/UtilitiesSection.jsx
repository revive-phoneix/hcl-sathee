import { useEffect, useMemo, useState } from "react";
import { Plus } from "lucide-react";
import { createEquipment, fetchEquipments } from "../../services/equipment";
import { matchesPortalCentre } from "../../utils/portalMapping";
import TableStatusRow from "../common/TableStatusRow";
import { SerialNoCell, SerialNoHeader } from "../common/tableSerial";
import { tableHeadRowClass, zebraRowClass } from "./analyticsUi";
import AddEquipmentModal from "./AddEquipmentModal";

export default function UtilitiesSection({ portalName, readOnly = false, isCustomCentre = false }) {
  const [equipments, setEquipments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [modalOpen, setModalOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const loadEquipments = async () => {
    if (isCustomCentre) {
      setEquipments([]);
      setLoading(false);
      return;
    }

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
  }, [isCustomCentre]);

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
              <tr style={tableHeadRowClass}>
                <SerialNoHeader className="text-left px-5 py-3.5 text-xs font-semibold text-gray-700 uppercase" />
                {[
                  ["Equipment Name", "text-left px-5"],
                  ["Description", "text-left px-4"],
                  ["Quantity", "text-center px-4"],
                  ["Serial Number", "text-left px-5"],
                ].map(([label, alignPad]) => (
                  <th
                    key={label}
                    className={`${alignPad} py-3.5 text-xs font-semibold text-gray-700 uppercase`}
                  >
                    {label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <TableStatusRow colSpan={5}>Loading utilities…</TableStatusRow>
              ) : error ? (
                <TableStatusRow colSpan={5} className="px-5 py-10 text-center text-sm text-red-500">
                  {error}
                </TableStatusRow>
              ) : rows.length === 0 ? (
                <TableStatusRow colSpan={5}>
                  No equipment added for this centre yet.
                </TableStatusRow>
              ) : (
                rows.map((item, i) => (
                  <tr key={item.id} className={zebraRowClass(i)}>
                    <SerialNoCell
                      index={i}
                      className="px-5 py-4 text-gray-500 font-medium tabular-nums"
                    />
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
