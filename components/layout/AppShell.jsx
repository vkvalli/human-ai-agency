import { Outlet } from "react-router-dom";
import Topbar from "./Topbar";
import PageContainer from "./PageContainer";

export default function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-slate-100 text-slate-900">
      <div className="relative z-10">
        <Topbar />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}
