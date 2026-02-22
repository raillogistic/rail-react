/**
 * Route Builder Component
 *
 * Purpose: Centralized route configuration and router setup
 * Args: None (configuration component)
 * Returns: Router configuration with Routes component
 * Raises: Error when route configuration is invalid
 * Example: <RouteBuilder />
 */

import React from "react";
import { Routes, Route } from "react-router-dom";
import { ROUTES } from "@/shared/routing/paths";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";

// Import page components
import { LoginPage, ForgotPasswordPage, ResetPasswordPage } from "@/auth/pages";
import { MainApp } from "@/app/shell/MainApp";
import { ModelImportPage } from "@/features/import/pages";

// Import view components

/**
 * Main Route Builder Component
 */
export const RouteBuilder: React.FC = () => {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path={ROUTES.LOGIN}
        element={
          <PublicRoute>
            <LoginPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.FORGOT_PASSWORD}
        element={
          <PublicRoute>
            <ForgotPasswordPage />
          </PublicRoute>
        }
      />
      <Route
        path={ROUTES.RESET_PASSWORD}
        element={
          <PublicRoute>
            <ResetPasswordPage />
          </PublicRoute>
        }
      />

      {/* Protected routes with main layout */}
      <Route
        path="/*"
        element={
          <ProtectedRoute>
            <MainApp />
          </ProtectedRoute>
        }
      />
    </Routes>
  );
};

/**
 * Protected Routes Component (used within MainApp layout)
 */
export const ProtectedRoutes: React.FC = () => {
  return (
    <Routes>
      {/* Default redirect to dashboard */}
      <Route path={ROUTES.MODEL_IMPORT} element={<ModelImportPage />} />

      {/* Dashboard */}

      {/* Users */}
      {/* <Route path={ROUTES.USERS} element={<UsersPage />} /> */}

      {/* Reports */}

      {/* Settings */}

      {/* 404 fallback */}
    </Routes>
  );
};

