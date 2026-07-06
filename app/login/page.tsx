"use client";

import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();

  return (
    <main className="min-h-screen flex items-center justify-center bg-[#0b1020]">
      <div className="bg-gray-800 p-8 rounded-xl w-[400px]">
        <h1 className="text-3xl font-bold text-white text-center">
          Moto Charm BD ERP
        </h1>

        <p className="text-gray-400 text-center mt-2">
          Business Management System
        </p>

        <input
          type="text"
          placeholder="Username"
          className="w-full mt-8 p-3 rounded bg-gray-700 text-white"
        />

        <input
          type="password"
          placeholder="Password"
          className="w-full mt-4 p-3 rounded bg-gray-700 text-white"
        />

        <button
          onClick={() => router.push("/dashboard")}
          className="w-full mt-6 bg-blue-600 hover:bg-blue-700 text-white p-3 rounded font-semibold"
        >
          Login
        </button>
      </div>
    </main>
  );
}