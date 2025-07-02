import { useState, useCallback, useEffect } from "react";
import {
  TrashIcon,
  PencilIcon,
  PlusIcon,
  XMarkIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
} from "@heroicons/react/24/solid";
import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Input,
  Textarea,
} from "@headlessui/react";
import Select from "react-select";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import Pagination from "../components/Pagination";
import DeleteDialog from "../components/DeleteDialog";
import SortableHeader, { SortField, SortOrder } from "../components/SortableHeader";
import { Condition as APICondition, Operator, conditionsApi } from "../services/api";

interface Condition {
  id: string;
  name: string;
  description: string;
  operators: string;
  columnName: string;
  value: string;
}

const ConditionManagement = () => {
  const [conditions, setConditions] = useState<Condition[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [availableColumns, setAvailableColumns] = useState<{ value: string; label: string }[]>([]);
  const [operators, setOperators] = useState<Operator[]>([]);

  const [modalState, setModalState] = useState({
    isOpen: false,
    action: "add", // "edit", "add", or "delete"
    selectedConditionId: null as string | null,
  });

  const [formState, setFormState] = useState({
    conditionName: "",
    conditionDescription: "",
    operators: "Select Operators",
    columnName: null as { value: string; label: string } | null,
    value: "",
    nameError: "",
    operatorsError: "",
    columnError: "",
    valueError: "",
    loading: false,
  });

  const [editState, setEditState] = useState({
    editMode: null as string | null,
    editConditionName: "",
    editConditionDescription: "",
    editOperators: "Select operators",
    editColumnName: null as { value: string; label: string } | null,
    editValue: "",
    nameError: "",
    operatorsError: "",
    columnError: "",
    valueError: "",
    loading: false,
  });

  const [sortField, setSortField] = useState<SortField | null>("name");
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Fetch conditions from API
  const fetchConditions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await conditionsApi.getConditions({
        page: 1, // Always fetch first page to get all data
        limit: 1000, // Fetch a large number to get all records
        sort: sortField || undefined,
        order: sortOrder
      });
      
      // Transform API conditions to match our component's format
      let transformedConditions: Condition[] = response.data.map((apiCondition: APICondition) => ({
        id: apiCondition.id?.toString() || "",
        name: apiCondition.condition,
        description: apiCondition.description,
        operators: apiCondition.operator,
        columnName: apiCondition.columnName || "",
        value: apiCondition.value.toString(),
      }));

      // Apply sorting if needed
      if (sortField) {
        transformedConditions = transformedConditions.sort((a, b) => {
          // Special handling for ID column (numeric sorting)
          if (sortField === 'id') {
            const aValue = parseInt(a[sortField], 10);
            const bValue = parseInt(b[sortField], 10);
            return sortOrder === 'asc' ? aValue - bValue : bValue - aValue;
          }
          
          // Special handling for value field - try numeric comparison first
          if (sortField === 'value') {
            const aNum = Number(a.value);
            const bNum = Number(b.value);
            // If both values are valid numbers, use numeric comparison
            if (!isNaN(aNum) && !isNaN(bNum)) {
              return sortOrder === 'asc' ? aNum - bNum : bNum - aNum;
            }
          }
          
          // For all other fields, use case-insensitive string comparison
          let aValue = String(a[sortField === 'name' ? 'name' : sortField]).toLowerCase().trim();
          let bValue = String(b[sortField === 'name' ? 'name' : sortField]).toLowerCase().trim();
          
          // Handle empty values
          if (!aValue) aValue = '';
          if (!bValue) bValue = '';
          
          // Compare values using localeCompare for proper string comparison
          const comparison = aValue.localeCompare(bValue);
          return sortOrder === 'asc' ? comparison : -comparison;
        });
      }

      // Apply pagination after sorting
      const startIndex = (currentPage - 1) * itemsPerPage;
      const endIndex = startIndex + itemsPerPage;
      const paginatedConditions = transformedConditions.slice(startIndex, endIndex);
      
      setConditions(paginatedConditions);
      setTotalCount(transformedConditions.length);
    } catch (err) {
      console.error("Error fetching conditions:", err);
      setError("Failed to fetch conditions");
      toast.error('Failed to fetch conditions. Please try again.');
      setConditions([]); // Clear conditions on error
      setTotalCount(0); // Reset total count on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder]);

  // Fetch available columns and operators
  const fetchFormData = useCallback(async () => {
    try {
      const [columnsData, operatorsData] = await Promise.all([
        conditionsApi.getAvailableColumns(),
        conditionsApi.getOperators()
      ]);

      // Transform columns data for react-select
      const columnsOptions = columnsData.map((column: string) => ({
        value: column,
        label: column
      }));
      setAvailableColumns(columnsOptions);
      setOperators(operatorsData);
    } catch (err) {
      console.error("Error fetching form data:", err);
      setError("Failed to fetch conditions");
      // toast.error('Failed to load form data. Please try again.');
      setAvailableColumns([]); // Clear columns on error
      setOperators([]); // Clear operators on error
    }
  }, []);

  useEffect(() => {
    fetchConditions();
    fetchFormData();
  }, [fetchConditions, fetchFormData]);

  // Handle Add Condition
  const handleAddCondition = useCallback(async () => {
    let hasError = false;
    if (!formState.conditionName.trim()) {
      setFormState((prev) => ({
        ...prev,
        nameError: "Condition name cannot be empty.",
      }));
      hasError = true;
    } else {
      setFormState((prev) => ({
        ...prev,
        nameError: "",
      }));
    }
    if (formState.operators === "Select Operators") {
      setFormState((prev) => ({
        ...prev,
        operatorsError: "Operators must be selected.",
      }));
      hasError = true;
    } else {
      setFormState((prev) => ({
        ...prev,
        operatorsError: "",
      }));
    }
    if (!formState.columnName) {
      setFormState((prev) => ({
        ...prev,
        columnError: "Column name cannot be empty.",
      }));
      hasError = true;
    } else {
      setFormState((prev) => ({
        ...prev,
        columnError: "",
      }));
    }
    if (hasError) return;

    try {
      setFormState((prev) => ({ ...prev, loading: true }));
      
      const newCondition: Omit<APICondition, 'id'> = {
        condition: formState.conditionName,
        description: formState.conditionDescription,
        operator: formState.operators,
        columnName: formState.columnName!.value,
        value: formState.value,
      };

      await conditionsApi.createCondition(newCondition);
      await fetchConditions(); // Refresh the list

      setFormState({
        conditionName: "",
        conditionDescription: "",
        operators: "Select Operators",
        columnName: null,
        value: "",
        nameError: "",
        operatorsError: "",
        columnError: "",
        valueError: "",
        loading: false,
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Condition added successfully!');
    } catch (err) {
      console.error("Error creating condition:", err);
      setError("Failed to create condition");
      toast.error('Failed to add condition. Please try again.');
    } finally {
      setFormState((prev) => ({ ...prev, loading: false }));
    }
  }, [formState, modalState, fetchConditions]);

  // Handle Edit Condition
  const handleEditCondition = useCallback(async () => {
    let hasError = false;
    if (!editState.editConditionName.trim()) {
      setEditState((prev) => ({
        ...prev,
        nameError: "Condition name cannot be empty.",
      }));
      hasError = true;
    }
    if (editState.editOperators === "Select operators") {
      setEditState((prev) => ({
        ...prev,
        operatorsError: "Operators must be selected.",
      }));
      hasError = true;
    }
    if (!editState.editColumnName) {
      setEditState((prev) => ({
        ...prev,
        columnError: "Column name cannot be empty.",
      }));
      hasError = true;
    }
    if (hasError) return;

    try {
      setEditState((prev) => ({ ...prev, loading: true }));
      
      const updatedCondition: Partial<APICondition> = {
        condition: editState.editConditionName,
        description: editState.editConditionDescription,
        operator: editState.editOperators,
        columnName: editState.editColumnName!.value,
        value: editState.editValue,
      };

      if (editState.editMode) {
        await conditionsApi.updateCondition(parseInt(editState.editMode), updatedCondition);
        await fetchConditions(); // Refresh the list
      }

      setEditState({
        editMode: null,
        editConditionName: "",
        editConditionDescription: "",
        editOperators: "Select operators",
        editColumnName: null,
        editValue: "",
        nameError: "",
        operatorsError: "",
        columnError: "",
        valueError: "",
        loading: false,
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Condition updated successfully!');
    } catch (err) {
      console.error("Error updating condition:", err);
      setError("Failed to update condition");
      toast.error('Failed to update condition. Please try again.');
    } finally {
      setEditState((prev) => ({ ...prev, loading: false }));
    }
  }, [editState, modalState, fetchConditions]);

  // Handle Delete Condition
  const handleDeleteCondition = useCallback(async (id: string) => {
    try {
      await conditionsApi.deleteCondition(parseInt(id));
      await fetchConditions(); // Refresh the list
      setModalState({ ...modalState, isOpen: false });
      toast.success('Condition deleted successfully!');
    } catch (err) {
      console.error("Error deleting condition:", err);
      setError("Failed to delete condition");
      toast.error('Failed to delete condition. Please try again.');
    }
  }, [modalState, fetchConditions]);

  const customStyles = {
    control: (provided: any) => ({
      ...provided,
      backgroundColor: "transparent",
      borderColor: "transparent",
      boxShadow: "none",
      padding: "0.35rem",
      "&:hover": {
        borderColor: "transparent",
      },
    }),
    option: (provided: any, state: any) => ({
      ...provided,
      backgroundColor: state.isSelected ? "#8e1b3e" : "transparent",
      color: state.isSelected ? "#fff" : "#333",
      padding: "0.75rem",
      cursor: "pointer",
      "&:hover": {
        backgroundColor: "#8e1b3e",
        color: "#fff",
      },
    }),
  };
  // Sorting toggle function
  const handleSort = useCallback((field: SortField) => {
    if (field === sortField) {
      setSortOrder(sortOrder === "asc" ? "desc" : "asc");
    } else {
      setSortField(field);
      setSortOrder("asc");
    }
  }, [sortField, sortOrder]);

  // Sorting icon
  const getSortIcon = useCallback(
    (field: "name" | "id" | "operators" | "description" | "columnName" | "value") => {
      if (sortField !== field) {
        return <ArrowsUpDownIcon className="inline w-4 h-4 ml-1" />;
      }
      return sortOrder === "asc" ? (
        <ArrowUpIcon className="inline w-4 h-4 ml-1" />
      ) : (
        <ArrowDownIcon className="inline w-4 h-4 ml-1" />
      );
    },
    [sortField, sortOrder]
  );

  // Start edit mode
  const startEdit = useCallback(
    (condition: Condition) => {
      setEditState({
        editMode: condition.id,
        editConditionName: condition.name,
        editConditionDescription: condition.description,
        editOperators: condition.operators,
        editColumnName: {
          value: condition.columnName,
          label: condition.columnName,
        },
        editValue: condition.value,
        nameError: "",
        operatorsError: "",
        columnError: "",
        valueError: "",
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
            <h2 className="text-2xl font-bold text-primary">Conditions</h2>
            <Button
              className="ms-auto bg-primary px-5 py-2 rounded-md text-white flex gap-2"
              onClick={() =>
                setModalState({ ...modalState, isOpen: true, action: "add" })
              }
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
              if (modalState.selectedConditionId) {
                handleDeleteCondition(modalState.selectedConditionId);
              }
            }}
            title="Confirm Delete"
            content="Are you sure you want to delete this condition?"
          />

          {/* Add/Edit Condition Dialog */}
          {modalState.action !== "delete" && (
            <Dialog
              open={modalState.isOpen && modalState.action !== "delete"}
              onClose={() => setModalState({ ...modalState, isOpen: false })}
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
                      ? "Edit Condition"
                      : "Add Condition"}
                  </DialogTitle>

                  <div className="flex flex-col gap-2 my-4">
                    <Input
                      type="text"
                      value={
                        modalState.action === "edit"
                          ? editState.editConditionName
                          : formState.conditionName
                      }
                      onChange={(e) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editConditionName: e.target.value,
                            })
                          : setFormState({
                              ...formState,
                              conditionName: e.target.value,
                            })
                      }
                      placeholder="Condition name"
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
                    <select
                      value={
                        modalState.action === "edit"
                          ? editState.editOperators
                          : formState.operators
                      }
                      onChange={(e) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editOperators: e.target.value,
                            })
                          : setFormState({
                              ...formState,
                              operators: e.target.value,
                            })
                      }
                      className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                    >
                      <option value="Select operators">Select Operators</option>
                      {operators.map((op) => (
                        <option key={op.id} value={op.operator}>
                          {op.operator}
                        </option>
                      ))}
                    </select>
                    {modalState.action === "edit" &&
                      editState.operatorsError && (
                        <p className="text-sm text-red-500">
                          {editState.operatorsError}
                        </p>
                      )}
                    {modalState.action === "add" &&
                      formState.operatorsError && (
                        <p className="text-sm text-red-500">
                          {formState.operatorsError}
                        </p>
                      )}
                    <Input
                      type="text"
                      value={
                        modalState.action === "edit"
                          ? editState.editValue
                          : formState.value
                      }
                      onChange={(e) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editValue: e.target.value,
                            })
                          : setFormState({
                              ...formState,
                              value: e.target.value,
                            })
                      }
                      placeholder="Enter Value"
                      className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                    />
                    {modalState.action === "edit" && editState.nameError && (
                      <p className="text-sm text-red-500">
                        {editState.valueError}
                      </p>
                    )}
                    {modalState.action === "add" && formState.valueError && (
                      <p className="text-sm text-red-500">
                        {formState.valueError}
                      </p>
                    )}
                    <Select
                      value={
                        modalState.action === "edit"
                          ? editState.editColumnName
                          : formState.columnName
                      }
                      onChange={(selectedOption) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editColumnName: selectedOption,
                            })
                          : setFormState({
                              ...formState,
                              columnName: selectedOption,
                            })
                      }
                      options={availableColumns}
                      className="w-full rounded-lg bg-black/5 focus:outline-none"
                      placeholder="Select Column"
                      styles={customStyles}
                    />
                    <Textarea
                      value={
                        modalState.action === "edit"
                          ? editState.editConditionDescription
                          : formState.conditionDescription
                      }
                      onChange={(e) =>
                        modalState.action === "edit"
                          ? setEditState({
                              ...editState,
                              editConditionDescription: e.target.value,
                            })
                          : setFormState({
                              ...formState,
                              conditionDescription: e.target.value,
                            })
                      }
                      placeholder="Description"
                      className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                    />
                    {modalState.action === "edit" && editState.columnError && (
                      <p className="text-sm text-red-500">
                        {editState.columnError}
                      </p>
                    )}
                    {modalState.action === "add" && formState.columnError && (
                      <p className="text-sm text-red-500">
                        {formState.columnError}
                      </p>
                    )}
                    <Button
                      className="bg-primary px-5 py-2 rounded-md text-white mt-2"
                      onClick={
                        modalState.action === "edit"
                          ? handleEditCondition
                          : handleAddCondition
                      }
                      disabled={editState.loading}
                    >
                      {editState.loading
                        ? "Saving..."
                        : modalState.action === "edit"
                        ? "Save Changes"
                        : "Add Condition"}
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
                  label="Condition"
                  field="name"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  caseInsensitive={true}
                />
                <SortableHeader
                  label="Description"
                  field="description"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  caseInsensitive={true}
                />
                <SortableHeader
                  label="Value"
                  field="value"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  caseInsensitive={true}
                />
                <SortableHeader
                  label="Operators"
                  field="operators"
                  currentSortField={sortField}
                  currentSortOrder={sortOrder}
                  onSort={handleSort}
                  caseInsensitive={true}
                />
                <SortableHeader
                  label="Column"
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
              {conditions.map((condition) => (
                <tr key={condition.id} className="border-b border-gray-300">
                  <td className="p-3 text-left">{condition.id}</td>
                  <td className="p-3 text-left">{condition.name}</td>
                  <td className="p-3 text-left">
                    {condition.description ? condition.description : "-"}
                  </td>
                  <td className="p-3 text-left">{condition.value}</td>
                  <td className="p-3 text-left">{condition.operators}</td>
                  <td className="p-3 text-left">{condition.columnName}</td>
                  <td className="p-3 text-left">
                    <div className="flex gap-2">
                      <button
                        onClick={() => startEdit(condition)}
                        className="bg-orange-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-orange-200"
                      >
                        <PencilIcon className="w-5 text-orange-500" />
                      </button>
                      <button
                        onClick={() => setModalState({ ...modalState, isOpen: true, action: "delete", selectedConditionId: condition.id })}
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
            <div className="border-t border-gray-200">
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

export default ConditionManagement;
