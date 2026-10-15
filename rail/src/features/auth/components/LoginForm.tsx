import React, { useState } from "react";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/shared/ui/kit/button";
import { Input } from "@/shared/ui/kit/input";
import { Label } from "@/shared/ui/kit/label";
import { Alert, AlertDescription } from "@/shared/ui/kit/alert";
import { MFAChallenge } from "./MFAChallenge";

interface LoginFormProps {
  onSuccess?: () => void;
  rateLimitMessage?: string;
}

export function LoginForm({ onSuccess, rateLimitMessage }: LoginFormProps) {
  const { login, verifyMFA, isLoading, error } = useAuth();
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [rememberMe, setRememberMe] = useState(false);
  const [lockoutEndTime, setLockoutEndTime] = useState<Date | null>(null);
  const [showMFA, setShowMFA] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const result = await login({ username, password, rememberMe });

    if (result.success) {
      onSuccess?.();
    } else if (result.requiresMFA) {
      setShowMFA(true);
    } else if (result.error?.code === "RATE_LIMITED") {
      // Calculate lockout end time from retryAfter
      const retryAfter = result.error.details?.retryAfter as number;
      if (retryAfter) {
        setLockoutEndTime(new Date(Date.now() + retryAfter));
      }
    }
  };

  const handleMFAVerify = async (code: string) => {
    const result = await verifyMFA(code);
    if (result.success) {
      onSuccess?.();
    }
  };

  const isLockedOut = lockoutEndTime && new Date() < lockoutEndTime;

  if (showMFA) {
    return (
      <MFAChallenge
        method="totp" // Assuming TOTP for now as per AuthManager implementation
        error={error?.message}
        isLoading={isLoading}
        onVerify={handleMFAVerify}
        onCancel={() => setShowMFA(false)}
      />
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      {error && (
        <Alert variant="destructive">
          <AlertDescription>{error.message}</AlertDescription>
        </Alert>
      )}
      {isLockedOut && (
        <Alert>
          <AlertDescription>
            {rateLimitMessage ||
              "Too many failed attempts. Please try again later."}
          </AlertDescription>
        </Alert>
      )}
      <div className="space-y-2">
        <Label htmlFor="username">Username</Label>
        <Input
          id="username"
          type="text"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          disabled={isLoading || isLockedOut}
          required
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="password">Password</Label>
        <Input
          id="password"
          type="password"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          disabled={isLoading || isLockedOut}
          required
        />
      </div>
      <div className="flex items-center space-x-2">
        <input
          id="rememberMe"
          type="checkbox"
          checked={rememberMe}
          onChange={(e) => setRememberMe(e.target.checked)}
          disabled={isLoading || isLockedOut}
        />
        <Label htmlFor="rememberMe" className="text-sm">
          Remember me
        </Label>
      </div>
      <Button
        type="submit"
        className="w-full"
        disabled={isLoading || isLockedOut}
      >
        {isLoading ? "Signing in..." : "Sign In"}
      </Button>
    </form>
  );
}
