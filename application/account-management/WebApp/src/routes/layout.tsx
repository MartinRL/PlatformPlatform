import { Outlet, useNavigate } from "react-router-dom";
import { Button } from "react-aria-components";
import AcmeLogo from "@/ui/acme-logo.svg";

export default function Root() {
  const navigate = useNavigate();

  function handleCreateTenant() {
    navigate("/tenant/create");
  }

  return (
    <div className="flex flex-row h-full w-full">
      <div className="flex gap-2 flex-col h-full w-80 border-r border-border bg-gray-100 px-6">
        <h1 className="flex gap-1 items-center order-1 border-t border-border px-4 py-8">
          <AcmeLogo className="w-6 h-6" /> ACME Company
        </h1>
        <div className="justify-start flex flex-row border-b border-border py-4">
          <Button className="bg-blue-600 text-white py-2 px-4 rounded-full" onPress={handleCreateTenant}>
            Create Account
          </Button>
        </div>
        <nav className="grow">
          <ul>
            <li className="p-4 hover:bg-gray-200 rounded-xl cursor-pointer">
              <a href="/">Account Management</a>
            </li>
            <li className="p-4 hover:bg-gray-200 rounded-xl cursor-pointer">
              <a href="/user-management">User Management</a>
            </li>
          </ul>
        </nav>
      </div>
      <div className="flex flex-col w-full h-full bg-background">
        <Outlet />
      </div>
    </div>
  );
}
