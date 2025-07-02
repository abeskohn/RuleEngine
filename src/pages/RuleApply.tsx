import { useState, useCallback, useEffect } from "react";
import {
  Button,
  Dialog,
  DialogPanel,
  DialogTitle,
  Input,
  Textarea,
} from "@headlessui/react";
import Select from "react-select";
import {
  PencilIcon,
  TrashIcon,
  XMarkIcon,
  PlusIcon,
  ArrowsUpDownIcon,
  ArrowUpIcon,
  ArrowDownIcon,
  EyeIcon,
} from "@heroicons/react/24/solid";
import Pagination from "../components/Pagination";
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { RuleGroup, ruleGroupsApi, conditionsApi, Column as APIColumn } from "../services/api";
import SortableHeader, { SortField as HeaderSortField, SortOrder } from "../components/SortableHeader";

/** TYPES **/
interface Column {
  id: string;
  name: string;
}

/** Each condition has its own column, comparison operator, logical operator, and a condition value. */
interface RuleCondition {
  conditionName: string;
  operator: "AND" | "OR" | "";
}

/** Rule holds general info plus an array of conditions. */
interface Rule {
  id: number;
  ruleName: string;
  description?: string;
  conditions: RuleCondition[];
  orderNumber: number;
  value: string;
  columnName: string;
}

/** Define Select Option type */
interface SelectOption {
  value: string;
  label: string;
}

/** REACT-SELECT CUSTOM STYLES **/
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

/** Operators for AND/OR **/
const logicalOperators = [
  { label: "AND", value: "AND" },
  { label: "OR", value: "OR" },
];

/** Validation error shape for each condition. */
type ConditionError = {
  conditionName?: string;
  operator?: string;
};

/** Overall form errors. */
type FormErrors = {
  ruleName?: string;
  description?: string;
  value?: string;
  columnName?: string;
  conditions: ConditionError[];
};

// Define sort field type to match API payload keys
type RuleSortField = 'id' | 'ruleName' | 'description' | 'columnName' | 'value' | 'orderNumber';

/* ------------------------------------------------------------------ */
/* SERVER ➜ UI  adapter  (flattens subGroups → conditions[])          */
/* ------------------------------------------------------------------ */

// This is the exact server shape you showed me.
type ApiRuleGroup = {
  id: number;
  column?: { id: number; columnName: string };
  description?: string;
  result: string;
  groupOrder: number;
  subGroups?: {
    id: number;
    parentGroupId: number;
    conditions: {
      id: number;
      conditionId: number;
      subGroupId: number;
      description: string;
      condition: string;
    }[];
  }[];
};

const toUiRule = (g: ApiRuleGroup): Rule => {
  const flatConditions: RuleCondition[] =
    g.subGroups?.flatMap((sg) =>
      sg.conditions.map((c) => ({
        conditionName: c.description || c.condition,
        operator: "", // real API doesn't send AND/OR info
      }))
    ) ?? [];

  return {
    id: g.id,
    ruleName: g.description ?? `Rule ${g.id}`, // UI expects ruleName
    description: g.description,
    columnName: g.column?.columnName ?? "",
    value: g.result,
    orderNumber: g.groupOrder,
    conditions: flatConditions,
  };
};
/* ------------------------------------------------------------------ */


/** MAIN COMPONENT **/
const RuleApply: React.FC = () => {
  // Rule list
  const [rules, setRules] = useState<Rule[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [totalCount, setTotalCount] = useState(0);
  const [availableColumns, setAvailableColumns] = useState<SelectOption[]>([]);
  const [availableConditions, setAvailableConditions] = useState<SelectOption[]>([]);

  // Controls the add/edit/delete modals
  const [modalState, setModalState] = useState<{
    isOpen: boolean;
    action: "add" | "edit" | "delete";
    selectedRuleId: string | null;
  }>({
    isOpen: false,
    action: "add",
    selectedRuleId: null,
  });

  // For viewing (read-only) a rule's details
  const [viewModalOpen, setViewModalOpen] = useState(false);
  const [viewedRule, setViewedRule] = useState<Rule | null>(null);

  // Add/Edit form data
  const [formState, setFormState] = useState<{
    ruleName: string;
    description?: string;
    orderNumber?: number;
    loading: boolean;
    value: string;
    columnName: string;
    conditions: RuleCondition[];
    errors: FormErrors;
  }>({
    ruleName: "",
    description: "",
    orderNumber: undefined,
    loading: false,
    value: "",
    columnName: "",
    conditions: [{ conditionName: "", operator: "" }],
    errors: { conditions: [] },
  });

  const [sortField, setSortField] = useState<RuleSortField>('ruleName');
  const [sortOrder, setSortOrder] = useState<SortOrder>("asc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Calculate total pages
  const totalPages = Math.ceil(totalCount / itemsPerPage);

  // Toggle sort function
  const toggleSort = useCallback((field: RuleSortField) => {
    if (sortField === field) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortOrder('asc');
    }
  }, [sortField, sortOrder]);

  // Get sort icon
  const getSortIcon = useCallback((field: RuleSortField) => {
    if (sortField !== field) {
      return <ArrowsUpDownIcon className="inline w-4 h-4 ml-1" />;
    }
    return sortOrder === 'asc' ? (
      <ArrowUpIcon className="inline w-4 h-4 ml-1" />
    ) : (
      <ArrowDownIcon className="inline w-4 h-4 ml-1" />
    );
  }, [sortField, sortOrder]);

  // Start edit function
  const startEdit = useCallback((rule: Rule) => {
    setFormState({
      ruleName: rule.ruleName,
      description: rule.description || "",
      orderNumber: rule.orderNumber || 0,
      loading: false,
      value: rule.value,
      columnName: rule.columnName,
      conditions: rule.conditions,
      errors: { conditions: [] }
    });
    setModalState({
      isOpen: true,
      action: "edit",
      selectedRuleId: rule.id.toString(),
    });
  }, []);

  // Confirm delete function
  const confirmDeleteRule = useCallback((id: string) => {
    setModalState({
      isOpen: true,
      action: "delete",
      selectedRuleId: id,
    });
  }, []);

  // Fetch rules from API
  const fetchRules = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Map frontend field names to API field names
      const sortFieldMap: Record<RuleSortField, string> = {
        id: 'id',
        ruleName: 'ruleName',
        description: 'description',
        columnName: 'columnName',
        value: 'value',
        orderNumber: 'orderNumber'
      };

      const response = await ruleGroupsApi.getRuleGroups({
        page: 1, // Always fetch first page to get all data
        limit: 1000, // Fetch a large number to get all records
        sort: sortFieldMap[sortField],
        order: sortOrder
      });
      
      // The response is already an array of rules
      if (Array.isArray(response)) {
        // 🔄 NEW: adapt the raw payload to the UI shape
        const adapted = Array.isArray(response) ? response.map(toUiRule) : [];

        // Apply sorting if needed
        let sortedRules = [...adapted];
        if (sortField) {
          sortedRules.sort((a, b) => {
            // Special handling for numeric fields
            if (sortField === 'id' || sortField === 'orderNumber') {
              const aValue = Number(a[sortField]) || 0;
              const bValue = Number(b[sortField]) || 0;
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
            const field = sortFieldMap[sortField] as keyof Rule; 
            // For all other fields, use case-insensitive string comparison
            let aValue = String(field).toLowerCase().trim();
            let bValue = String(field).toLowerCase().trim();
            
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
        const paginatedRules = sortedRules.slice(startIndex, endIndex);
        
        setRules(paginatedRules);
        setTotalCount(sortedRules.length);
      } else {
        console.error('Invalid response format:', response);
        setRules([]);
        setError('Failed to fetch rules');
        toast.error('Failed to fetch rules. Please try again.');
      }
    } catch (err) {
      console.error("Error fetching rules:", err);
      setError("Failed to fetch rules");
      toast.error('Failed to fetch rules. Please try again.');
      setRules([]); // Clear rules on error
      setTotalCount(0); // Reset total count on error
    } finally {
      setLoading(false);
    }
  }, [currentPage, sortField, sortOrder]);

  // Fetch available columns and conditions
  const fetchFormData = useCallback(async () => {
    try {
      const [columnsData, conditionsData] = await Promise.all([
        conditionsApi.getColumns({ page: 1, limit: 1000 }), // Get all columns
        conditionsApi.getConditions({ page: 1, limit: 1000 }) //Get All Conditions
      ]);

      // Transform columns data for react-select
      if (columnsData?.data && Array.isArray(columnsData.data)) {
        const columnsOptions = columnsData.data.map((column: APIColumn) => ({
          value: column.columnName,
          label: column.columnName
        }));
        setAvailableColumns(columnsOptions);
      } else {
        console.error('Invalid columns data format:', columnsData);
        setAvailableColumns([]);
        toast.error('Failed to load columns data');
      }

      // Transform conditions data for react-select
      if (conditionsData?.data && Array.isArray(conditionsData.data)) {
        const conditionsOptions = conditionsData.data.map((condition: any) => ({
          value: condition.condition,
          label: condition.condition
        }));
        setAvailableConditions(conditionsOptions);
      } else {
        console.error('Invalid conditions data format:', conditionsData);
        setAvailableConditions([]);
        toast.error('Failed to load conditions data');
      }
    } catch (err) {
      console.error("Error fetching form data:", err);
      setError("Failed to fetch rules");
      // toast.error('Failed to load form data. Please try again.');
      setAvailableColumns([]); // Clear columns on error
      setAvailableConditions([]); // Clear conditions on error
    }
  }, []);

  useEffect(() => {
    fetchRules();
    fetchFormData();
  }, [fetchRules, fetchFormData]);

  // Handle Add Rule
  const handleAddRule = useCallback(async () => {
    let hasError = false;
    const errors: FormErrors = { conditions: [] };

    if (!formState.ruleName.trim()) {
      errors.ruleName = "Rule name cannot be empty.";
      hasError = true;
    }
    if (!formState.columnName) {
      errors.columnName = "Column name cannot be empty.";
      hasError = true;
    }
    if (!formState.value) {
      errors.value = "Value cannot be empty.";
      hasError = true;
    }

    formState.conditions.forEach((condition, index) => {
      const conditionErrors: ConditionError = {};
      if (!condition.conditionName) {
        conditionErrors.conditionName = "Condition name cannot be empty.";
        hasError = true;
      }
      if (!condition.operator) {
        conditionErrors.operator = "Operator cannot be empty.";
        hasError = true;
      }
      errors.conditions[index] = conditionErrors;
    });

    if (hasError) {
      setFormState(prev => ({ ...prev, errors }));
      return;
    }

    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const newRule: Omit<RuleGroup, 'id'> = {
        ruleName: formState.ruleName,
        description: formState.description || "",
        columnName: formState.columnName,
        value: formState.value,
        conditions: formState.conditions,
        orderNumber: formState.orderNumber || 0
      };

      await ruleGroupsApi.createRuleGroup(newRule);
      await fetchRules();

      setFormState({
        ruleName: "",
        description: "",
        orderNumber: undefined,
        loading: false,
        value: "",
        columnName: "",
        conditions: [{ conditionName: "", operator: "" }],
        errors: { conditions: [] }
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Rule added successfully!');
    } catch (err) {
      console.error("Error creating rule:", err);
      setError("Failed to create rule");
      toast.error('Failed to add rule. Please try again.');
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  }, [formState, modalState, fetchRules]);

  // Handle Edit Rule
  const handleEditRule = useCallback(async () => {
    if (!modalState.selectedRuleId) return;

    let hasError = false;
    const errors: FormErrors = { conditions: [] };

    if (!formState.ruleName.trim()) {
      errors.ruleName = "Rule name cannot be empty.";
      hasError = true;
    }
    if (!formState.columnName) {
      errors.columnName = "Column name cannot be empty.";
      hasError = true;
    }
    if (!formState.value) {
      errors.value = "Value cannot be empty.";
      hasError = true;
    }

    formState.conditions.forEach((condition, index) => {
      const conditionErrors: ConditionError = {};
      if (!condition.conditionName) {
        conditionErrors.conditionName = "Condition name cannot be empty.";
        hasError = true;
      }
      if (!condition.operator) {
        conditionErrors.operator = "Operator cannot be empty.";
        hasError = true;
      }
      errors.conditions[index] = conditionErrors;
    });

    if (hasError) {
      setFormState(prev => ({ ...prev, errors }));
      return;
    }

    try {
      setFormState(prev => ({ ...prev, loading: true }));
      
      const updatedRule: Omit<RuleGroup, 'id'> = {
        ruleName: formState.ruleName,
        description: formState.description || "",
        columnName: formState.columnName,
        value: formState.value,
        conditions: formState.conditions,
        orderNumber: formState.orderNumber || 0
      };

      await ruleGroupsApi.updateRuleGroup(modalState.selectedRuleId, updatedRule);
      await fetchRules();

      setFormState({
        ruleName: "",
        description: "",
        orderNumber: 0,
        loading: false,
        value: "",
        columnName: "",
        conditions: [{ conditionName: "", operator: "" }],
        errors: { conditions: [] }
      });
      setModalState({ ...modalState, isOpen: false });
      toast.success('Rule updated successfully!');
    } catch (err) {
      console.error("Error updating rule:", err);
      setError("Failed to update rule");
      toast.error('Failed to update rule. Please try again.');
    } finally {
      setFormState(prev => ({ ...prev, loading: false }));
    }
  }, [formState, modalState, fetchRules]);

  // Handle Delete Rule
  const handleDeleteRule = useCallback(async () => {
    if (!modalState.selectedRuleId) return;

    try {
      await ruleGroupsApi.deleteRuleGroup(modalState.selectedRuleId);
      await fetchRules();
      setModalState({ ...modalState, isOpen: false });
      toast.success('Rule deleted successfully!');
    } catch (err) {
      console.error("Error deleting rule:", err);
      setError("Failed to delete rule");
      toast.error('Failed to delete rule. Please try again.');
    }
  }, [modalState, fetchRules]);

  // Handle Add Condition
  const handleAddCondition = () => {
    setFormState(prev => ({
      ...prev,
      conditions: [...prev.conditions, { conditionName: "", operator: "" }],
      errors: {
        ...prev.errors,
        conditions: [...prev.errors.conditions, {}]
      }
    }));
  };

  // Handle Remove Condition
  const handleRemoveCondition = (index: number) => {
    setFormState(prev => ({
      ...prev,
      conditions: prev.conditions.filter((_, i) => i !== index),
      errors: {
        ...prev.errors,
        conditions: prev.errors.conditions.filter((_, i) => i !== index)
      }
    }));
  };

  // Handle View Rule
  const handleViewRule = (rule: Rule) => {
    setViewedRule(rule);
    setViewModalOpen(true);
  };

  // Close View Modal
  const closeViewModal = () => {
    setViewModalOpen(false);
    setViewedRule(null);
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <ToastContainer />
      <div className="bg-white shadow-lg rounded-xl border border-black/500 my-4 w-full">
        <div className="flex p-4">
          <h2 className="text-2xl font-bold text-primary">Rule Apply</h2>
          <Button
            className="ms-auto bg-primary px-5 py-2 rounded-md text-white flex gap-2"
            onClick={() => {
              // Reset form state when opening add modal
              setFormState({
                ruleName: "",
                description: "",
                orderNumber: undefined,
                loading: false,
                value: "",
                columnName: "",
                conditions: [{ conditionName: "", operator: "" }],
                errors: { conditions: [] }
              });
              setModalState({
                isOpen: true,
                action: "add",
                selectedRuleId: null,
              });
            }}
          >
            <PlusIcon className="w-5" />
            Add
          </Button>
        </div>

        {/** ADD/EDIT DIALOG **/}
        <Dialog
          open={
            modalState.isOpen &&
            (modalState.action === "add" || modalState.action === "edit")
          }
          onClose={() => setModalState({ ...modalState, isOpen: false })}
        >
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <DialogPanel className="bg-white rounded-lg shadow-lg max-w-lg w-full">
              <div className="p-6 pb-0 relative">
                <button
                  className="absolute top-6 right-6 text-gray-500 hover:text-gray-800"
                  onClick={() =>
                    setModalState({ ...modalState, isOpen: false })
                  }
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <DialogTitle className="text-lg font-semibold">
                  {modalState.action === "edit" ? "Edit Rule" : "Apply Rule"}
                </DialogTitle>
              </div>

              <div className="flex flex-col gap-2 max-h-[80vh] overflow-y-auto p-6">
                {/* Rule Name */}
                <Input
                  type="text"
                  placeholder="Rule Name"
                  value={formState.ruleName}
                  onChange={(e) =>
                    setFormState({ ...formState, ruleName: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                />
                {formState.errors.ruleName && (
                  <div className="text-red-500 text-sm mb-2">
                    {formState.errors.ruleName}
                  </div>
                )}

                {/* Description */}
                <Textarea
                  placeholder="Description"
                  value={formState.description}
                  onChange={(e) =>
                    setFormState({ ...formState, description: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none min-h-[70px]"
                />
                {formState.errors.description && (
                  <div className="text-red-500 text-sm mb-2">
                    {formState.errors.description}
                  </div>
                )}
                {/* Select Column */}
                <Select
                  isClearable={false}
                  options={availableColumns}
                  getOptionLabel={(option: SelectOption) => option.label}
                  getOptionValue={(option: SelectOption) => option.value}
                  value={availableColumns.find(option => option.value === formState.columnName)}
                  onChange={(option: SelectOption | null) =>
                    setFormState({ ...formState, columnName: option?.value || "" })
                  }
                  styles={customStyles}
                  className="w-full rounded-lg bg-black/5 focus:outline-none"
                  placeholder="Select Column"
                />
                {formState.errors.columnName && (
                  <div className="text-red-500 text-sm mb-2">
                    {formState.errors.columnName}
                  </div>
                )}

                {/* Conditions List */}
                {formState.conditions.map((cond, index) => (
                  <div key={index} className="flex flex-col gap-2 mb-2">
                    <div className="flex nowrap gap-2">
                      <div className="w-full">
                        <select
                          className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                          value={cond.conditionName}
                          onChange={(e) => {
                            const updated = [...formState.conditions];
                            updated[index].conditionName = e.target.value;
                            setFormState({ ...formState, conditions: updated });
                          }}
                        >
                          <option value="">Select Condition</option>
                          {availableConditions.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        {formState.errors.conditions[index]?.conditionName && (
                          <div className="text-red-500 text-sm mb-1">
                            {formState.errors.conditions[index]?.conditionName}
                          </div>
                        )}
                      </div>
                      <div className="w-full">
                        <select
                          className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                          value={cond.operator}
                          onChange={(e) => {
                            const updated = [...formState.conditions];
                            updated[index].operator = e.target.value as
                              | "AND"
                              | "OR"
                              | "";
                            setFormState({ ...formState, conditions: updated });
                          }}
                        >
                          <option value="">Select Operator</option>
                          {logicalOperators.map((op) => (
                            <option key={op.value} value={op.value}>
                              {op.label}
                            </option>
                          ))}
                        </select>
                        {formState.errors.conditions[index]?.operator && (
                          <div className="text-red-500 text-sm mb-1">
                            {formState.errors.conditions[index]?.operator}
                          </div>
                        )}
                      </div>
                      {/* Add/Remove Buttons */}
                      <div className="flex gap-2 min-w-[80px]">
                        {formState.conditions.length > 1 && (
                          <button
                            onClick={() => handleRemoveCondition(index)}
                            className="bg-red-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-red-200"
                          >
                            <XMarkIcon className="w-5 text-red-500" />
                          </button>
                        )}
                        {index === formState.conditions.length - 1 && (
                          <Button
                            className="bg-green-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-green-200"
                            onClick={handleAddCondition}
                          >
                            <PlusIcon className="w-5 text-green-500" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
                {/* Value */}
                <Input
                  type="text"
                  placeholder="Value"
                  value={formState.value}
                  onChange={(e) =>
                    setFormState({ ...formState, value: e.target.value })
                  }
                  className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none"
                />
                {formState.errors.value && (
                  <div className="text-red-500 text-sm mb-2">
                    {formState.errors.value}
                  </div>
                )}
                {/* Order Number */}
                <Input
                  type="text"
                  placeholder="Order Number"
                  value={formState.orderNumber ?? ""}
                  onChange={(e) =>
                    setFormState({
                      ...formState,
                      orderNumber: e.target.value
                        ? Number(e.target.value)
                        : undefined,
                    })
                  }
                  className="w-full rounded-lg bg-black/5 py-3 px-3 focus:outline-none mt-2"
                />
              </div>

              <div className="px-6 pb-6 pt-0">
                {/* Save/Apply button */}
                <Button
                  className="bg-primary px-5 py-3 rounded-md text-white w-full"
                  onClick={
                    modalState.action === "edit"
                      ? handleEditRule
                      : handleAddRule
                  }
                >
                  {formState.loading
                    ? "Saving..."
                    : modalState.action === "edit"
                    ? "Save Rule"
                    : "Apply Rule"}
                </Button>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/** DELETE DIALOG **/}
        <Dialog
          open={modalState.isOpen && modalState.action === "delete"}
          onClose={() => setModalState({ ...modalState, isOpen: false })}
        >
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <DialogPanel className="bg-white rounded-lg shadow-lg max-w-sm w-full">
              <div className="p-6 relative">
                <button
                  className="absolute top-6 right-2 text-gray-500 hover:text-gray-800"
                  onClick={() =>
                    setModalState({ ...modalState, isOpen: false })
                  }
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <DialogTitle className="text-lg font-semibold mb-4">
                  Confirm Delete
                </DialogTitle>
                <p className="mb-6">
                  Are you sure you want to delete this rule?
                </p>
                <div className="flex justify-end gap-3">
                  <Button
                    className="bg-red-500 text-white px-4 py-2 rounded"
                    onClick={handleDeleteRule}
                  >
                    Delete
                  </Button>
                  <Button
                    className="bg-gray-300 px-4 py-2 rounded"
                    onClick={() =>
                      setModalState({ ...modalState, isOpen: false })
                    }
                  >
                    Cancel
                  </Button>
                </div>
              </div>
            </DialogPanel>
          </div>
        </Dialog>

        {/** VIEW (READ-ONLY) DIALOG **/}
        <Dialog open={viewModalOpen} onClose={closeViewModal}>
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center">
            <DialogPanel className="bg-white rounded-lg shadow-lg max-w-lg w-full">
              <div className="px-6 py-4 relative border-b">
                <button
                  className="absolute top-6 right-2 text-gray-500 hover:text-gray-800"
                  onClick={closeViewModal}
                >
                  <XMarkIcon className="w-6 h-6" />
                </button>
                <DialogTitle className="text-lg font-semibold">
                  View Rule
                </DialogTitle>
              </div>
              {viewedRule && (
                <div className="p-6 max-h-[80vh] overflow-y-auto">
                  <div className="w-full mb-3">
                    <strong>Rule Name</strong>
                    <h3>{viewedRule.ruleName}</h3>
                  </div>
                  <div className="w-full mb-3">
                    <strong>Description</strong>
                    <h3>{viewedRule.description || "-"}</h3>
                  </div>
                  <div className="w-full mb-3">
                    <strong>Column</strong>
                    <h3>{viewedRule.columnName || "-"}</h3>
                  </div>
                  <div className="mb-4">
                    {viewedRule.conditions.length ? (
                      <div className="mt-2">
                        {viewedRule.conditions.map((cond, idx) => (
                          <div key={idx}>
                            <div>
                              <strong>Conditions:</strong>{" "}
                              {cond.conditionName || "N/A"}
                            </div>
                            <div>
                              <strong>Operator</strong>{" "}
                              {cond.operator || "N/A"}
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="mt-2">No conditions</p>
                    )}
                  </div>
                  <div className="w-full mb-3">
                    <strong>Value</strong>
                    <h3>{viewedRule.value || "-"}</h3>
                  </div>
                  <div className="w-full mb-3">
                    <strong>Order Number</strong>
                    <h3>{viewedRule.orderNumber ?? "-"}</h3>
                  </div>
                </div>
              )}
            </DialogPanel>
          </div>
        </Dialog>

        {/** LIST TABLE **/}
        <table className="w-full">
          <thead>
            <tr className="bg-primary text-white">
              <th 
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('id')}
              >
                ID {getSortIcon('id')}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('ruleName')}
              >
                Rule Name {getSortIcon('ruleName')}
              </th>
              <th 
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('description')}
              >
                Description {getSortIcon('description')}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('columnName')}
              >
                Column {getSortIcon('columnName')}
              </th>
              <th 
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('value')}
              >
                Value {getSortIcon('value')}
              </th>
              <th
                className="p-3 text-left cursor-pointer"
                onClick={() => toggleSort('orderNumber')}
              >
                Order Number {getSortIcon('orderNumber')}
              </th>
              <th className="p-3 text-left min-w-[120px]">Actions</th>
            </tr>
          </thead>
          <tbody>
            {rules.map((rule) => (
              <tr key={rule.id} className="border-b border-gray-300">
                <td className="p-3 text-left">{rule.id}</td>
                <td className="p-3 text-left">{rule.ruleName}</td>
                <td className="p-3 text-left">{rule.description}</td>
                <td className="p-3 text-left">{rule.columnName}</td>
                <td className="p-3 text-left">{rule.value}</td>
                <td className="p-3 text-left">{rule.orderNumber}</td>
                <td className="p-3 text-left">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleViewRule(rule)}
                      className="bg-blue-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-blue-200"
                    >
                      <EyeIcon className="w-5 text-blue-500" />
                    </button>
                    <button
                      onClick={() => startEdit(rule)}
                      className="bg-orange-100 rounded-full w-9 h-9 flex items-center justify-center hover:bg-orange-200"
                    >
                      <PencilIcon className="w-5 text-orange-500" />
                    </button>
                    <button
                      onClick={() => confirmDeleteRule(rule.id.toString())}
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

        {/** PAGINATION **/}
        {!loading && !error && (
          <div className="border-t border-gray-200">
            <Pagination
              currentPage={currentPage}
              totalPages={totalPages}
              totalItems={totalCount}
              itemsPerPage={itemsPerPage}
              setCurrentPage={setCurrentPage}
            />
          </div>
        )}
      </div>
    </div>
  );
};

export default RuleApply;
