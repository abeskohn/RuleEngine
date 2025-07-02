import { useState } from "react";

export interface Column {
  id: number;
  name: string;
}

export const useColumns = () => {
  const [columns, setColumns] = useState<Column[]>([]);

  const addColumn = (name: string) => {
    setColumns([...columns, { id: Date.now(), name }]);
  };

  const editColumn = (id: number, name: string) => {
    setColumns(columns.map((col) => (col.id === id ? { ...col, name } : col)));
  };

  const deleteColumn = (id: number) => {
    setColumns(columns.filter((col) => col.id !== id));
  };

  return { columns, addColumn, editColumn, deleteColumn };
};
