import { useState, useCallback, useEffect } from "react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Input,
} from "@headlessui/react";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from "../components/Pagination";
import DeleteDialog from "../components/DeleteDialog";
import SortableHeader, { SortField, SortOrder } from "../components/SortableHeader";
import { Column, conditionsApi } from "../services/api";
 
interface ColumnData {
  id: string;
  columnName: string;
}
 
const ColumnManagement = () => {
  const [columns, setColumns] = useState<ColumnData[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
 
  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "add", // "edit", "add", or "delete"
    selectedColumnId: null as string | null,
  });
 
  const [formState, setFormState] = useState({
    columnName: "",
    nameError: "",
    loading: false,
  });
 
  const [editState, setEditState] = useState({
    editMode: null as string | null,
    editColumnName: "",
    nameError: "",
    loading: false,
  });
 
  const [sortField, setSortField] = useState<SortField | null>("columnName");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
 
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
 
  // Add reset form function
  const resetForm = useCallback(() => {
    setFormState({
      columnName: "",
      nameError: "",
      loading: false,
    });
  }, []);
 
  // Fetch columns from API
  const fetchColumns = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await conditionsApi.getColumns({
        page: 1,
        limit: 1000,
        sort: "columnName",
        order: sortOrder
      });
     
      // Transform API columns to match our component's format
      let transformedColumns: ColumnData[] = response.data.map((apiColumn: Column) => ({
        id: apiColumn.id?.toString() || "",
        columnName: apiColumn.columnName,
      }));
 
      // Apply sorting if needed
      if (sortField) {
        transformedColumns = transformedColumns.sort((a, b) => {
          // Special handling for ID column (numeric sorting)
          if (sortField === 'id') {
            const aValue = parseInt(a[sortField], 10);
            const bValue = parseInt(b[sortField], 10);
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          }
         
          // Get the values to compare
          let aValue = String(a[sortField as keyof ColumnData]).toLowerCase().trim();
          let bValue = String(b[sortField as keyof ColumnData]).toLowerCase().trim();
         
          // Handle empty values
          if (!aValue) aValue = '';
          if (!bValue) bValue = '';
         
          // Compare values
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }
 
      // Apply pagination after sorting
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedColumns = transformedColumns.slice(startIndex, endIndex);
     
      setColumns(paginatedColumns);
      setTotalCount(response.totalCount || transformedColumns.length);
    } catch (err) {
      console.error("Error fetching columns:", err);
      setError("Failed to fetch columns");
      toast.error('Failed to fetch columns. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder]);
 
  useEffect(() => {
    fetchColumns();
  }, [fetchColumns]);
 
  // Handle Add Column
  const handleAddColumn = useCallback(async () => {
    let hasError = false;
    if (!formState.columnName.trim()) {
      setFormState((prev) => ({
        ...prev,
        nameError: "Column name cannot be empty.",
      }));
      hasError = true;
    }
    if (hasError) return;
 
    try {
      setFormState((prev) => ({ ...prev, loading: true }));
     
      const newColumn = {
        columnName: formState.columnName,
      };
 
      await conditionsApi.createColumn(newColumn);
      await fetchColumns(); // Refresh the list
 
      setFormState({
        columnName: "",
        nameError: "",
        loading: false,
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Column added successfully!');
    } catch (err) {
      console.error("Error creating column:", err);
      setError("Failed to create column");
      toast.error('Failed to add column. Please try again.');
    } finally {
      setFormState((prev) => ({ ...prev, loading: false }));
    }
  }, [formState, modalState, fetchColumns]);
 
  // Handle Edit Column
  const handleEditColumn = useCallback(async () => {
    let hasError = false;
    if (!editState.editColumnName.trim()) {
      setEditState((prev) => ({
        ...prev,
        nameError: "Column name cannot be empty.",
      }));
      hasError = true;
    }
    if (hasError) return;
 
    try {
      setEditState((prev) => ({ ...prev, loading: true }));
     
      const updatedColumn = {
        columnName: editState.editColumnName,
      };
 
      if (editState.editMode) {
        await conditionsApi.updateColumn(parseInt(editState.editMode), updatedColumn);
        await fetchColumns(); // Refresh the list
      }
 
      setEditState({
        editMode: null,
        editColumnName: "",
        nameError: "",
        loading: false,
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Column updated successfully!');
    } catch (err) {
      console.error("Error updating column:", err);
      setError("Failed to update column");
      toast.error('Failed to update column. Please try again.');
    } finally {
      setEditState((prev) => ({ ...prev, loading: false }));
    }
  }, [editState, modalState, fetchColumns]);
 
  // Handle Delete Column
  const handleDeleteColumn = useCallback(async (id: string) => {
    try {
      await conditionsApi.deleteColumn(parseInt(id));
      await fetchColumns(); // Refresh the list
      setModalState({ ...modalState, isOpen: false });
      toast.success('Column deleted successfully!');
    } catch (err) {
      console.error("Error deleting column:", err);
      setError("Failed to delete column");
      toast.error('Failed to delete column. Please try again.');
    }
  }, [modalState, fetchColumns]);
 
  // Sorting toggle function
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);
 
  // Start edit mode
  const startEdit = useCallback(
    (column: ColumnData) => {
      setEditState({
        editMode: column.id,
        editColumnName: column.columnName,
        nameError: "",
        loading: false,
      });
      setModalState({ ...modalState, isOpen: true, action: "edit" });
    },
    [modalState]
  );
 
  // Handle page change
  const handlePageChange = useCallback((newPage: number) => {
    setCurrentPage(newPage);
  }, []);
 
  return (
    <div className="px-4">
      <ToastContainer
        position="top-right"
        autoClose={3000}
        hideProgressBar={false}
        newestOnTop
        closeOnClick
        rtl={false}
        pauseOnFocusLoss
        draggable
        pauseOnHover
        theme="light"
      />
      <div className="flex flex-col lg:flex-row gap-4 mt-3">
        <div className="bg-white shadow-lg rounded-xl border border-black/500 my-4 w-full">
          <div className="flex p-4">
            <h2 className="text-2xl font-bold text-primary">Columns</h2>
            <Button
              className="ms-auto bg-primary px-5 py-2 rounded-md text-white flex gap-2"
              onClick={() => {
                resetForm(); // Reset form before opening modal
                setModalState({ ...modalState, isOpen: true, action: "add" });
              }}
            >
              <PlusIcon className="w-5" />
              Add
            </Button>
          </div>
 
          {/* Delete Dialog */}
          <DeleteDialog
            isOpen={modalState.isOpen && modalState.action === "delete"}
            onClose={() => setModalState({ ...modalState, isOpen: false })}
            onDelete={(id) => {
              if (modalState.selectedColumnId) {
                handleDeleteColumn(modalState.selectedColumnId);
              }
            }}
            title="Confirm Delete"
            content="Are you sure you want to delete this column?"
          />
 
          {/* Add/Edit Column Dialog */}
          {modalState.action !== "delete" && (
            <Dialog
              open={modalState.isOpen && modalState.action !== "delete"}
              onClose={() => {
                if (modalState.action === "add") {
                  resetForm(); // Reset form when closing add modal
                }
                setModalState({ ...modalState, isOpen: false });
              }}
            >
              <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
                <DialogPanel className="bg-white rounded-lg p-6 shadow-lg max-w-lg w-full">
                  <button
                    className="absolute top-2 right-2 text-gray-500 hover:text-gray-800"
                    onClick={() =>
                      setModalState({ ...modalState, isOpen: false })
                    }
                  >
                    <XMarkIcon className="w-6 h-6" />
                  </button>
                  <DialogTitle className="text-lg font-semibold">
                    {modalState.action === "edit"
                      ? "Edit Column"
                      : "Add Column"}
                  </DialogTitle>
 
                  <div className="flex flex-col gap-2 my-4">
                    <Input
                      type="text"
                      value={
                        modalState.action === "edit"
                          ? editState.editColumnName
                          : formState.columnName
                      }
                      onChange={(e) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editColumnName: e.target.value,
                            })
                          : setFormState({
                              ...formState,
                              columnName: e.target.value,
                            })
                      }
                      placeholder="Column name"
                      className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                    />
                    {modalState.action === "edit" && editState.nameError && (
                      <p className="text-sm text-red-500">
                        {editState.nameError}
                      </p>
                    )}
                    {modalState.action === "add" && formState.nameError && (
                      <p className="text-sm text-red-500">
                        {formState.nameError}
                      </p>
                    )}
                    <Button
                      className="bg-primary px-5 py-2 rounded-md text-white mt-2"
                      onClick={
                        modalState.action === "edit"
                          ? handleEditColumn
                          : handleAddColumn
                      }
                      disabled={editState.loading}
                    >
                      {editState.loading
                        ? "Saving..."
                        : modalState.action === "edit"
                        ? "Save Changes"
                        : "Add Column"}
                    </Button>
                  </div>
                </DialogPanel>
              </div>
            </Dialog>
          )}
 
          {/* Table */}
          <table className="w-full">
            <thead>
              <tr className="bg-primary text-white">
                <SortableHeader
                  label="ID"
                  field="id"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  className="w-[80px]"
                  caseInsensitive={false}
                />
                <SortableHeader
                  label="Name"
                  field="columnName"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  caseInsensitive={true}
                />
                <th className="p-3 text-left w-[120px]">Actions</th>
              </tr>
            </thead>
            <tbody>
              {columns.map((column) => (
                <tr key={column.id} className="border-b border-gray-300">
                  <td className="p-3 text-left">{column.id}</td>
                  <td className="p-3 text-left">{column.columnName}</td>
                  <td className="p-3 text-left">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(column)}
                        className="bg-orange-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-orange-200"
                      >
                        <PencilIcon className="w-5 text-orange-500" />
                      </button>
                      <button
                        onClick={() => setModalState({ ...modalState, isOpen: true, action: "delete", selectedColumnId: column.id })}
                        className="bg-red-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-200"
                      >
                        <TrashIcon className="w-5 text-red-500" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
 
          {/* Add loading state */}
          {loading && (
            <div className="flex justify-center items-center p-4">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            </div>
          )}
 
          {/* Add error state */}
          {error && (
            <div className="text-red-500 text-center p-4">
              {error}
            </div>
          )}
 
          {/* Pagination */}
          {!loading && !error && (
            <div className=" border-t border-gray-200">
              <Pagination
                currentPage={currentPage}
                totalPages={Math.ceil(totalCount / itemsPerPage)}
                totalItems={totalCount}
                itemsPerPage={itemsPerPage}
                setCurrentPage={setCurrentPage}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
 
export default ColumnManagement;