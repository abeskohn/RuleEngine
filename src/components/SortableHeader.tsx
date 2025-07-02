import React from 'react';
import { ArrowsUpDownIcon, ArrowUpIcon, ArrowDownIcon } from "@heroicons/react/24/solid";

export type SortField = 'id' | 'name' | 'description' | 'value' | 'operators' | 'columnName';
export type SortOrder = 'asc' | 'desc';

interface SortableHeaderProps {
  label: string;
  field: SortField;
  currentSortField: SortField | null;
  currentSortOrder: SortOrder;
  onSort: (field: SortField) => void;
  className?: string;
  caseInsensitive?: boolean;
}

const SortableHeader: React.FC<SortableHeaderProps> = ({
  label,
  field,
  currentSortField,
  currentSortOrder,
  onSort,
  className = '',
  caseInsensitive = true
}) => {
  const getSortIcon = () => {
    if (currentSortField !== field) {
      return <ArrowsUpDownIcon className="inline w-4 h-4 ml-1" />;
    }
    return currentSortOrder === "asc" ? (
      <ArrowUpIcon className="inline w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="inline w-4 h-4 ml-1" />
    );
  };

  return (
    <th
      className={`p-3 text-left cursor-pointer hover:bg-primary/10 ${className}`}
      onClick={() => onSort(field)}
      title={caseInsensitive ? "Case-insensitive sort" : "Case-sensitive sort"}
    >
      {label} {getSortIcon()}
    </th>
  );
};

export default SortableHeader; 