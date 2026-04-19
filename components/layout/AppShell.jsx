import { Outlet } from "react-router-dom";
import OceanBackdrop from "./OceanBackdrop";
import Topbar from "./Topbar";
import PageContainer from "./PageContainer";

export default function AppShell() {
  return (
    <div className="relative min-h-screen overflow-x-hidden bg-[#04111b] text-slate-900">
      <OceanBackdrop />
      <div className="relative z-10">
        <Topbar />
        <PageContainer>
          <Outlet />
        </PageContainer>
      </div>
    </div>
  );
}
