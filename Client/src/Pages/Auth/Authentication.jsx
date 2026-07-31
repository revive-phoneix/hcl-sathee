import AuthBrand from "../../Components/Auth/AuthBrand";
import LoginCard from "../../Components/Auth/LoginCard";

export default function AdminAuth({ onLoginSuccess }) {
  return (
    <div className="min-h-screen bg-[#F1F5F9] text-white flex flex-col">

      {/* Center Brand + Login */}
      <div className="flex-1 flex items-center justify-center px-6">
        <div className="flex flex-col items-center justify-center gap-8">
          <AuthBrand />
          <LoginCard onLoginSuccess={onLoginSuccess} />
        </div>
      </div>

      {/* Footer */}
      <div className="pb-6">
        <p className="text-center text-sm text-slate-500">
          HCL SATHEE Platform
        </p>
      </div>

    </div>
  );
}
