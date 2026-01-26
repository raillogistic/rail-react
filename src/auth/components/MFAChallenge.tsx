import React, { useState } from 'react';
import { Button } from '@/lib/components/ui/button';
import { Input } from '@/lib/components/ui/input';
import { Label } from '@/lib/components/ui/label';
import { Alert, AlertDescription } from '@/lib/components/ui/alert';

export interface MFAChallengeProps {
  method: 'totp' | 'email' | 'sms' | 'webauthn';
  hint?: string;
  error?: string;
  isLoading?: boolean;
  onVerify: (code: string) => Promise<void>;
  onCancel: () => void;
}

export function MFAChallenge({
  method,
  hint,
  error,
  isLoading,
  onVerify,
  onCancel
}: MFAChallengeProps) {
  const [code, setCode] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (code.trim()) {
      await onVerify(code.trim());
    }
  };

  const getTitle = () => {
    switch (method) {
      case 'totp': return 'Authenticator App';
      case 'sms': return 'SMS Verification';
      case 'email': return 'Email Verification';
      default: return 'Verification';
    }
  };

  const getDescription = () => {
    switch (method) {
      case 'totp': return 'Please enter the code from your authenticator app.';
      case 'sms': return `We sent a code to your phone ending in ${hint}.`;
      case 'email': return `We sent a code to your email ${hint}.`;
      default: return 'Please enter your verification code.';
    }
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-medium">{getTitle()}</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {getDescription()}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="space-y-2">
          <Label htmlFor="mfa-code">Verification Code</Label>
          <Input
            id="mfa-code"
            type="text"
            inputMode="numeric"
            autoComplete="one-time-code"
            pattern="[0-9]*"
            value={code}
            onChange={(e) => setCode(e.target.value)}
            disabled={isLoading}
            placeholder="Enter code"
            className="text-center text-lg tracking-widest"
            autoFocus
          />
        </div>

        <div className="flex flex-col space-y-2">
          <Button type="submit" disabled={isLoading || !code.trim()}>
            {isLoading ? 'Verifying...' : 'Verify'}
          </Button>
          <Button type="button" variant="ghost" onClick={onCancel} disabled={isLoading}>
            Cancel
          </Button>
        </div>
      </form>
    </div>
  );
}
