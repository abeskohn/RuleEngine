import React from "react";
import {
  ChevronDoubleLeftIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ChevronDoubleRightIcon,
} from "@heroicons/react/24/solid";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  totalItems: number;
  itemsPerPage: number;
  setCurrentPage: (page: number | ((prevPage: number) => number)) => void;
}

const Pagination: React.FC<PaginationProps> = ({
  currentPage,
  totalPages,
  totalItems,
  itemsPerPage,
  setCurrentPage,
}) => {
  const startItem = (currentPage - 1) * itemsPerPage + 1;
  const endItem = Math.min(currentPage * itemsPerPage, totalItems);

  return (
    <div className="flex justify-between items-center p-4">
      <div className="sm:flex sm:flex-1 sm:items-center sm:justify-between">
        <div>
          <p className="text-gray-800">
            Showing{" "}
            <span className="font-medium">{startItem}</span> to{" "}
            <span className="font-medium">{endItem}</span>{" "}
            of <span className="font-medium">{totalItems}</span> results
          </p>
        </div>
        <div>
          <nav
            className="isolate inline-flex -space-x-px rounded-md shadow-xs"
            aria-label="Pagination"
          >
            <button
              onClick={() => setCurrentPage(1)}
              disabled={currentPage === 1}
              className="relative rounded-l-md inline-flex items-center px-4 py-2 text-black ring-1 ring-gray-300 ring-inset hover:bg-w-50 hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">First</span>
              <ChevronDoubleLeftIcon className="w-[20px] fill-black/80" />
            </button>

            <button
              onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
              disabled={currentPage === 1}
              className="relative inline-flex items-center px-4 py-2 text-black ring-1 ring-gray-300 ring-inset hover:bg-w-50 hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Previous</span>
              <ChevronLeftIcon className="w-[20px] fill-black/80" />
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`relative inline-flex items-center px-4 py-2 font-semibold ${
                  currentPage === page
                    ? "bg-primary text-white"
                    : "text-black ring-1 ring-gray-300 ring-inset hover:bg-primary hover:text-white"
                } focus:z-20 focus:outline-offset-0`}
              >
                {page}
              </button>
            ))}

            <button
              onClick={() =>
                setCurrentPage((prev) => Math.min(prev + 1, totalPages))
              }
              disabled={currentPage === totalPages}
              className="relative inline-flex items-center px-4 py-2 text-black ring-1 ring-gray-300 ring-inset hover:bg-primary hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Next</span>
              <ChevronRightIcon className="w-[20px] fill-black/80" />
            </button>

            <button
              onClick={() => setCurrentPage(totalPages)}
              disabled={currentPage === totalPages}
              className="relative rounded-r-md inline-flex items-center px-4 py-2 text-black ring-1 ring-gray-300 ring-inset hover:bg-primary hover:text-white focus:z-20 focus:outline-offset-0 disabled:opacity-50"
            >
              <span className="sr-only">Last</span>
              <ChevronDoubleRightIcon className="w-[20px] fill-black/80" />
            </button>
          </nav>
        </div>
      </div>
    </div>
  );
};

export default Pagination;
