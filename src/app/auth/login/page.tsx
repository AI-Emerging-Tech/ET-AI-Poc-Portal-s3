// /src/app/auth/login/page.tsx
'use client';

import { signIn } from "next-auth/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Spinner from 'components/Spinner';

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");
    const res = await signIn("credentials", {
      redirect: false,
      email,  // Updated to email instead of username
      password,
    });

    if (res?.error) {
      setError("Invalid login credentials"); // Customize error message if desired
      setLoading(false)
    } else {
      setError("");
      setLoading(false);
      router.push("/"); // Redirect to homepage after successful login
    }
  };

  return (
    <div className="flex items-center justify-center bg-gray-100 py-16 px-4">
      {loading && (
        <Spinner/>
      )}
      <div className="bg-white p-8 rounded-lg shadow-lg w-full max-w-md min-h-[500px] flex flex-col justify-between">
        <h1 className="text-2xl font-bold mb-6 text-center text-primary">Login</h1>
        {error && <p className="text-red-500 mb-4">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-gray-700">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-gray-700">Password</label>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:border-blue-500"
              required
            />
          </div>
          <button
            type="submit"
            className="btn-ai w-full bg-blue-600 text-white py-2 px-4 rounded-lg hover:bg-blue-700 transition"
          >
            Login
          </button>
        </form>

        <p className="text-center mt-4">
          Don't have an account? <br /> <a href="/auth/register" className="text-blue-600">Create one here</a>.
        </p>
      </div>
    </div>
  );
}
