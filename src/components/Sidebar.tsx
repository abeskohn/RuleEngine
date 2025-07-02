import { NavLink } from "react-router-dom";
import {
  HomeIcon,
  ListBulletIcon,
  TableCellsIcon,
} from "@heroicons/react/24/solid";

export const Sidebar = () => {
  return (
    <div className="w-64 bg-gray-900 text-white min-h-screen flex flex-col">
      <div className="flex items-center gap-2 mb-6 bg-gray-700 p-5">
        <h1 className="text-xl font-bold">Hospital Management</h1>
      </div>
      <nav>
        <ul className="space-y-2 px-2">
          <li>
            <NavLink
              to="/"
              className={({ isActive }) =>
                `flex items-center gap-2 p-3 rounded-md hover:bg-gray-700 ${
                  isActive ? "bg-primary hover:bg-primary" : ""
                }`
              }
            >
              <HomeIcon className="w-[20px]" />
              <span>Column</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/rules"
              className={({ isActive }) =>
                `flex items-center gap-2 p-3 rounded-md hover:bg-gray-700 ${
                  isActive ? "bg-primary hover:bg-primary" : ""
                }`
              }
            >
              <TableCellsIcon className="w-[20px]" />
              <span>Conditions</span>
            </NavLink>
          </li>
          <li>
            <NavLink
              to="/rule-apply"
              className={({ isActive }) =>
                `flex items-center gap-2 p-3 rounded-md hover:bg-gray-700 ${
                  isActive ? "bg-primary hover:bg-primary" : ""
                }`
              }
            >
              <ListBulletIcon className="w-[20px]" />
              <span>Rule Apply</span>
            </NavLink>
          </li>
        </ul>
      </nav>
    </div>
  );
};
