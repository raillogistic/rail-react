/**
 * Login Form Component with validation
 *
 * Purpose: Secure login form with username/password validation and error handling
 * Args: onSubmit callback for form submission
 * Returns: JSX form element with validation
 * Raises: ValidationError when form validation fails
 * Example: <LoginForm onSubmit={handleLogin} />
 */

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  WifiOff,
} from "lucide-react";
import { useAuthContext } from "@/auth/context";
import {
  isServerOfflineError,
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/utils/offline-detector";

// Validation schema
const loginSchema = z.object({
  username: z.string().min(1, "Nom d utilisateur is required"),
  password: z.string(),
});

type LoginFormData = z.infer<typeof loginSchema>;

interface LoginFormProps {
  onForgotPassword?: () => void;
}

export const LoginForm: React.FC<LoginFormProps> = ({ onForgotPassword }) => {
  const { login, isLoading, error, clearError } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  // Check server connectivity on component mount and when errors occur
  useEffect(() => {
    const checkConnectivity = async () => {
      setIsCheckingConnectivity(true);
      const isOnline = await testServerConnectivity();
      setIsServerOnline(isOnline);
      setIsCheckingConnectivity(false);
    };

    checkConnectivity();

    // Listen for offline status changes
    const cleanup = onOfflineStatusChange((isOffline) => {
      setIsServerOnline(!isOffline);
    });

    return cleanup;
  }, []);

  // Check connectivity when login errors occur
  useEffect(() => {
    if (error && isServerOfflineError(error)) {
      const checkConnectivity = async () => {
        setIsCheckingConnectivity(true);
        const isOnline = await testServerConnectivity();
        setIsServerOnline(isOnline);
        setIsCheckingConnectivity(false);
      };
      checkConnectivity();
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      reset();
    } catch (error) {
      // Error is handled by the auth context
      console.error("Login error:", error);
    }
  };

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  return (
    <div className="w-full max-w-md mx-auto">
      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        {/* username Field */}
        <div className="space-y-2">
          <label
            htmlFor="username"
            className="block text-sm font-medium text-gray-700"
          >
            username Address
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Mail className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register("username")}
              type="text"
              id="username"
              autoComplete="username"
              className={`
                block w-full pl-10 pr-3 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.username
                    ? "border-red-300 text-red-900 placeholder-red-300"
                    : "border-gray-300 text-gray-900 placeholder-gray-400"
                }
              `}
              placeholder="Enter your username"
            />
          </div>
          {errors.username && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.username.message}</span>
            </div>
          )}
        </div>

        {/* Password Field */}
        <div className="space-y-2">
          <label
            htmlFor="password"
            className="block text-sm font-medium text-gray-700"
          >
            Password
          </label>
          <div className="relative">
            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
              <Lock className="h-5 w-5 text-gray-400" />
            </div>
            <input
              {...register("password")}
              type={showPassword ? "text" : "password"}
              id="password"
              autoComplete="current-password"
              className={`
                block w-full pl-10 pr-10 py-2 border rounded-md shadow-sm
                focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500
                ${
                  errors.password
                    ? "border-red-300 text-red-900 placeholder-red-300"
                    : "border-gray-300 text-gray-900 placeholder-gray-400"
                }
              `}
              placeholder="Enter your password"
            />
            <button
              type="button"
              onClick={togglePasswordVisibility}
              className="absolute inset-y-0 right-0 pr-3 flex items-center"
            >
              {showPassword ? (
                <EyeOff className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              ) : (
                <Eye className="h-5 w-5 text-gray-400 hover:text-gray-600" />
              )}
            </button>
          </div>
          {errors.password && (
            <div className="flex items-center space-x-1 text-red-600 text-sm">
              <AlertCircle className="h-4 w-4" />
              <span>{errors.password.message}</span>
            </div>
          )}
        </div>

        {/* Server Status Indicator */}
        {!isServerOnline && (
          <div className="bg-orange-50 border border-orange-200 rounded-md p-3 mb-4">
            <div className="flex items-center space-x-2">
              <WifiOff className="h-5 w-5 text-orange-400" />
              <div>
                <span className="text-orange-700 text-sm font-medium">
                  Server Offline
                </span>
                <p className="text-orange-600 text-xs mt-1">
                  Unable to connect to the server at localhost:8000/graphql.
                  Please check your connection or try again later.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Global Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-md p-3">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-red-400" />
              <span className="text-red-700 text-sm">
                {error.userMessage || error.message || "An error occurred"}
              </span>
            </div>
          </div>
        )}

        {/* Forgot Password Link */}
        <div className="flex justify-end">
          <button
            type="button"
            onClick={onForgotPassword}
            className="text-sm text-blue-600 hover:text-blue-500 focus:outline-none focus:underline"
          >
            Forgot your password?
          </button>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={isSubmitting || isLoading || !isServerOnline}
          className={`
            w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white
            focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500
            ${
              isSubmitting || isLoading || !isServerOnline
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }
          `}
        >
          {isCheckingConnectivity ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Checking connection...</span>
            </div>
          ) : isSubmitting || isLoading ? (
            <div className="flex items-center space-x-2">
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              <span>Signing in...</span>
            </div>
          ) : !isServerOnline ? (
            <div className="flex items-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span>Server Offline</span>
            </div>
          ) : (
            "Sign In"
          )}
        </button>
      </form>
    </div>
  );
};
