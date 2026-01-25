/**
 * Main Application Component
 *
 * Purpose: Root application component with routing and authentication
 * Args: None (root component)
 * Returns: Complete application with providers and routing
 * Raises: None (handles app initialization)
 * Example: <App /> (used in main.tsx)
 */

import React from "react";
import { BrowserRouter } from "react-router-dom";
import { ApolloProvider } from "@apollo/client/react";
import { AuthProvider } from "@/auth/context";
import { AuthDependentContent } from "./views/AuthDependentContent";
import client from "@/graphql/apollo-client";

import "./App.css";

const App: React.FC = () => {
  return (
    <ApolloProvider client={client}>
      <BrowserRouter>
        <AuthProvider>
          <AuthDependentContent />
        </AuthProvider>
      </BrowserRouter>
    </ApolloProvider>
  );
};

export default App;
