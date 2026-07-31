export default function TableStatusRow({ colSpan, children, className }) {
  return (
    <tr>
      <td colSpan={colSpan} className={className ?? "px-5 py-10 text-center text-sm text-gray-400"}>
        {children}
      </td>
    </tr>
  );
}
