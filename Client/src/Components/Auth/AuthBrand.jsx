import logo from "../../assets/sathee.svg";

export default function AuthBrand() {
  return (
    <div className="flex flex-col items-center justify-center gap-3 text-center">

      {/* Round Centered Logo */}
      <div className="shrink-0">
        <div className="flex h-24 w-24 items-center justify-center overflow-hidden rounded-full border border-slate-700 bg-white shadow-lg">
          <img
            src={logo}
            alt="SATHEE logo"
            className="h-full w-full rounded-full object-cover"
          />
        </div>
      </div>

      {/* Text below logo */}
      <div>
        <h1 className="text-2xl font-bold tracking-wide text-black">
          SATHEE
        </h1>
      </div>

    </div>
  );
}