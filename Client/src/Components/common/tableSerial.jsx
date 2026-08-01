export const SERIAL_HEADER = "S.No";

export function SerialNoHeader({ className = "", style }) {
  return (
    <th className={className} style={style}>
      {SERIAL_HEADER}
    </th>
  );
}

export function SerialNoCell({ index, className = "", style }) {
  return (
    <td className={className} style={style}>
      {index + 1}
    </td>
  );
}
