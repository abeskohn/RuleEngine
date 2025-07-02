import { Dialog } from "@headlessui/react";

interface DeleteDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onDelete: (id: string) => void;
  title: string;
  content: string;
}

const DeleteDialog: React.FC<DeleteDialogProps> = ({
  isOpen,
  onClose,
  onDelete,
  title,
  content,
}) => {
  return (
    <Dialog open={isOpen} onClose={onClose}>
      <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-50">
        <Dialog.Panel className="bg-white rounded-lg p-6 shadow-lg max-w-md w-full">
          <Dialog.Title className="text-lg font-semibold mb-4">{title}</Dialog.Title>
          <p className="mb-6">{content}</p>
          <div className="flex justify-end gap-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
            >
              Cancel
            </button>
            <button
              onClick={() => onDelete("")}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
            >
              Delete
            </button>
          </div>
        </Dialog.Panel>
      </div>
    </Dialog>
  );
};

export default DeleteDialog;
