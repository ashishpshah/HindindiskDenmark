interface Props {
  active: boolean;
  onToggle: () => void;
  disabled?: boolean;
}

export function InlineStatusSelect({ active, onToggle, disabled }: Props) {
  return (
    <select
      value={active ? "1" : "0"}
      disabled={disabled}
      onChange={onToggle}
      className={`cursor-pointer rounded-full border px-2.5 py-0.5 text-xs font-medium outline-none
        transition focus:ring-2 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50
        ${active
          ? "border-green-200 bg-green-50 text-green-700 focus:ring-green-300"
          : "border-red-200   bg-red-50   text-red-700   focus:ring-red-300"}`}
    >
      <option value="1">Active</option>
      <option value="0">Inactive</option>
    </select>
  );
}
