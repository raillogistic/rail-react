import React from "react";
import { Routes, Route } from "react-router-dom";
import { ProtectedRoute } from "./ProtectedRoute";
import { PublicRoute } from "./PublicRoute";
import { MainApp } from "@/app/shell/MainApp";
import { getAllRoutes } from "./manifestRegistry";

/**
 * Builds public routes from manifests and mounts protected shell for all other routes.
 */
export const RouteBuilder: React.FC = () => {
  const publicRoutes = getAllRoutes().filter(
    (route) => route.guard === "public" && route.element,
  );

  return (
    <Routes>
      {publicRoutes.map((route) => (
        <Route
          key={route.id}
          path={route.path}
          element={<PublicRoute>{route.element}</PublicRoute>}
        />
      ))}
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

