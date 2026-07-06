import Image from "next/image";

export default function Home() {
  return (
    <main className="relative min-h-screen bg-[#090d18] flex items-center justify-center overflow-hidden">

      {/* Background Logo */}
      <div className="absolute inset-0 flex items-center justify-center">
        <Image
          src="/logo.jpg"
          alt="Moto Charm Logo"
          width={900}
          height={900}
          className="opacity-[0.08] select-none pointer-events-none"
          priority
        />
      </div>

      {/* Login Box */}
      <div className="relative z-10 w-full max-w-md rounded-2xl border border-white/10 bg-white/10 backdrop-blur-xl p-8 shadow-2xl">
        <h1 className="text-3xl font-bold text-center text-white">
          Moto Charm BD ERP
        </h1>

        <p className="mt-2 text-center text-gray-300">
          Business Management System
        </p>

        <input
          type="text"
          placeholder="Username"
          className="mt-8 w-full rounded-lg bg-white/20 p-3 text-white placeholder-gray-300 outline-none"
        />

        <input
          type="password"
          placeholder="Password"
          className="mt-4 w-full rounded-lg bg-white/20 p-3 text-white placeholder-gray-300 outline-none"
        />

        <button className="mt-6 w-full rounded-lg bg-blue-600 py-3 font-semibold text-white hover:bg-blue-700">
          Login
        </button>
      </div>

    </main>
  );
}