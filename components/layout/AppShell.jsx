import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import PageContainer from "./PageContainer";

export default function AppShell() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-sky-50 via-white to-slate-50 text-slate-900">
      <Topbar />
      <PageContainer>
        <Outlet />
      </PageContainer>
    </div>
  );
}