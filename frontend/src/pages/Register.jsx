import React, { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { yupResolver } from "@hookform/resolvers/yup";
import * as Yup from "yup";

// -----------------------------
// Validation Schema
// -----------------------------
const schema = Yup.object().shape({
  email: Yup.string()
    .email("Invalid email address")
    .required("Email is required"),
  password: Yup.string()
    .min(8, "Password must be at least 8 characters")
    .required("Password is required"),
  confirmPassword: Yup.string()
    .oneOf([Yup.ref("password")], "Passwords must match")
    .required("Confirm Password is required"),
});

export default function Register() {
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
    reset,
  } = useForm({
    resolver: yupResolver(schema),
  });

  const onSubmit = async (data) => {
    setMessage("");
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5000/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: data.email, password: data.password }),
      });

      const result = await res.json();

      if (res.ok) {
        setMessage("Registration successful! You can now login.");
        reset();
      } else {
        setMessage(result.message || "Registration failed");
      }
    } catch (error) {
      console.error("Register error:", error);
      setMessage("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-100">
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl p-8">
        {/* Logo & Title */}
        <div className="flex flex-col items-center mb-6">
          <div className="w-14 h-14 bg-gradient-to-r from-blue-600 to-purple-600 rounded-xl flex items-center justify-center shadow-lg">
            <svg
              className="w-8 h-8 text-white"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </div>
          <h1 className="mt-3 text-3xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent">
            Key Keeper
          </h1>
          <p className="text-sm text-gray-500">Create your account to get started</p>
        </div>

        {/* Register Form */}
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
          <div>
            <input
              type="email"
              placeholder="Email"
              className={`w-full p-3 rounded-xl border ${
                errors.email ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-blue-500`}
              {...register("email")}
            />
            {errors.email && (
              <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Password"
              className={`w-full p-3 rounded-xl border ${
                errors.password ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              {...register("password")}
            />
            {errors.password && (
              <p className="text-red-500 text-sm mt-1">{errors.password.message}</p>
            )}
          </div>

          <div>
            <input
              type="password"
              placeholder="Confirm Password"
              className={`w-full p-3 rounded-xl border ${
                errors.confirmPassword ? "border-red-500" : "border-gray-300"
              } focus:outline-none focus:ring-2 focus:ring-purple-500`}
              {...register("confirmPassword")}
            />
            {errors.confirmPassword && (
              <p className="text-red-500 text-sm mt-1">{errors.confirmPassword.message}</p>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className={`w-full py-3 rounded-xl text-white font-medium shadow-lg transition-all duration-200 ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-gradient-to-r from-blue-600 to-purple-600 hover:shadow-xl"
            }`}
          >
            {loading ? "Registering..." : "Register"}
          </button>
        </form>

        {message && (
          <p
            className={`mt-4 text-center font-medium ${
              message.includes("successful") ? "text-green-600" : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}

        {/* Link to Login */}
        <p className="mt-5 text-center text-gray-600">
          Already a User?{" "}
          <Link
            to="/login"
            className="font-semibold text-blue-600 hover:text-blue-800 transition-colors"
          >
            Login here
          </Link>
        </p>
      </div>
    </div>
  );
}
