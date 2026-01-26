import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery } from "@apollo/client";
import { useAuth } from "../hooks/useAuth";
import { Button } from "@/lib/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import { Input } from "@/lib/components/ui/input";
import { Label } from "@/lib/components/ui/label";
import { Alert, AlertDescription } from "@/lib/components/ui/alert";
import {
  SETUP_MFA_MUTATION,
  VERIFY_MFA_SETUP_MUTATION,
} from "@/graphql/mutations";
import { GET_MFA_STATUS } from "@/graphql/queries";
import { ROUTES } from "@/routes/links";
import { MFAManagement } from "../components/MFAManagement";
import { MFAErrorHandler } from "../utils/mfa-errors";

interface MFASetupPageProps {
  embedded?: boolean;
  ephemeralToken?: string;
  onComplete?: (code: string) => Promise<void>;
}

export function MFASetupPage({
  embedded,
  ephemeralToken,
  onComplete,
}: MFASetupPageProps) {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [step, setStep] = useState<"intro" | "setup" | "verify" | "success">(
    "intro",
  );
  const [mfaData, setMfaData] = useState<{
    secret: string;
    qrCodeUrl: string;
    backupCodes: string[];
  } | null>(null);
  const [verificationCode, setVerificationCode] = useState("");
  const [error, setError] = useState<string | null>(null);

  // Skip query if using ephemeral token (unauthenticated flow)
  const {
    data: mfaStatus,
    loading: mfaLoading,
    refetch: refetchMFA,
  } = useQuery(GET_MFA_STATUS, {
    skip: !!ephemeralToken || !user,
  });

  const mfaEnabled = mfaStatus?.me?.mfa_enabled;

  const [setupMfa, { loading: loadingSetup }] = useMutation(SETUP_MFA_MUTATION);
  const [verifyMfaSetup, { loading: loadingVerify }] = useMutation(
    VERIFY_MFA_SETUP_MUTATION,
  );

  useEffect(() => {
    if (!user && !ephemeralToken) {
      // navigate(ROUTES.LOGIN); // Commented out for now
    }
  }, [user, navigate, ephemeralToken]);

  // Auto-start setup if embedded and ephemeral token present
  useEffect(() => {
    if (embedded && ephemeralToken && step === "intro") {
      handleStartSetup();
    }
  }, [embedded, ephemeralToken, step]);

  const handleStartSetup = async () => {
    setError(null);
    try {
      const { data } = await setupMfa({
        variables: {
          method: "totp",
          ephemeral_token: ephemeralToken,
        },
      });
      if (data?.setup_mfa) {
        setMfaData({
          secret: data.setup_mfa.secret,
          qrCodeUrl: data.setup_mfa.qr_code_url,
          backupCodes: data.setup_mfa.backup_codes || [],
        });
        setStep("setup");
      } else {
        setError("Failed to initialize MFA setup.");
      }
    } catch (err) {
      console.error(err);
      const details = MFAErrorHandler.getErrorDetails(err);
      setError(details.message);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mfaData) return;
    setError(null);

    try {
      const { data } = await verifyMfaSetup({
        variables: {
          code: verificationCode,
          secret: mfaData.secret,
          ephemeral_token: ephemeralToken,
        },
      });

      if (data?.verify_mfa_setup?.ok) {
        if (onComplete) {
          // If embedded, we consider verification complete when the code is verified
          // and we call the parent callback to finish the login process.
          // Note: In some flows, verifyMfaSetup might not log the user in directly,
          // so the parent needs to call verifyMfaLogin or similar.
          // But wait, verifyMfaSetup *activates* the device.
          // If this is during login, the user still needs to authenticate their session.
          // The parent (LoginPage) expects a code to call verifyMfaLogin.
          // So we should pass the code to onComplete.
          await onComplete(verificationCode);
        } else {
          setStep("success");
          if (refetchMFA) refetchMFA();
        }
      } else {
        const rawError = data?.verify_mfa_setup?.errors?.[0];
        const details = MFAErrorHandler.getErrorDetails({
          code: rawError,
          message: rawError,
        });
        setError(
          details.message +
            (details.suggestion ? " " + details.suggestion : ""),
        );
      }
    } catch (err) {
      console.error(err);
      const details = MFAErrorHandler.getErrorDetails(err);
      setError(
        details.message + (details.suggestion ? " " + details.suggestion : ""),
      );
    }
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
  };

  if (mfaLoading && !ephemeralToken) {
    return <div className="p-8 text-center">Loading security settings...</div>;
  }

  // If MFA is already enabled and we are not in embedded mode, show management view
  if (mfaEnabled && !embedded) {
    return <MFAManagement />;
  }

  if (step === "intro") {
    return (
      <div className={embedded ? "" : "container max-w-md mx-auto py-12"}>
        <Card className={embedded ? "border-0 shadow-none" : ""}>
          <CardHeader>
            <CardTitle>Set up Multi-Factor Authentication</CardTitle>
            <CardDescription>
              Enhance your account security by requiring a verification code
              when logging in.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-4">
              Multi-Factor Authentication (MFA) adds an extra layer of security
              to your account. You will need an authenticator app like Google
              Authenticator or Authy.
            </p>
            {error && (
              <Alert variant="destructive" className="mb-4">
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={handleStartSetup}
              disabled={loadingSetup}
              className="w-full"
            >
              Start Setup
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  if (step === "setup" && mfaData) {
    return (
      <div className={embedded ? "" : "container max-w-md mx-auto py-12"}>
        <Card className={embedded ? "border-0 shadow-none" : ""}>
          <CardHeader>
            <CardTitle>Scan QR Code</CardTitle>
            <CardDescription>
              Scan this QR code with your authenticator app.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="flex justify-center">
              {/* Note: In a real app, use a QR code component. For now, displaying an image or placeholder */}
              <img
                src={mfaData.qrCodeUrl}
                alt="QR Code"
                className="w-48 h-48 border rounded"
              />
            </div>

            <div className="text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Can't scan the code?
              </p>
              <div className="flex items-center gap-2">
                <code className="bg-muted p-2 rounded text-xs flex-1 block overflow-hidden text-ellipsis">
                  {mfaData.secret}
                </code>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => copyToClipboard(mfaData.secret)}
                >
                  Copy
                </Button>
              </div>
            </div>

            <Button onClick={() => setStep("verify")} className="w-full">
              Next
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (step === "verify") {
    return (
      <div className={embedded ? "" : "container max-w-md mx-auto py-12"}>
        <Card className={embedded ? "border-0 shadow-none" : ""}>
          <CardHeader>
            <CardTitle>Verify Code</CardTitle>
            <CardDescription>
              Enter the 6-digit code from your authenticator app.
            </CardDescription>
          </CardHeader>
          <form onSubmit={handleVerify}>
            <CardContent>
              <div className="space-y-4">
                {error && (
                  <Alert variant="destructive">
                    <AlertDescription>{error}</AlertDescription>
                  </Alert>
                )}
                <div className="space-y-2">
                  <Label htmlFor="code">Verification Code</Label>
                  <Input
                    id="code"
                    value={verificationCode}
                    onChange={(e) => setVerificationCode(e.target.value)}
                    placeholder="123456"
                    maxLength={6}
                    pattern="[0-9]*"
                    autoFocus
                  />
                </div>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button
                variant="ghost"
                type="button"
                onClick={() => setStep("setup")}
              >
                Back
              </Button>
              <Button
                type="submit"
                disabled={loadingVerify || verificationCode.length !== 6}
              >
                Verify
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    );
  }

  if (step === "success") {
    return (
      <div className={embedded ? "" : "container max-w-md mx-auto py-12"}>
        <Card className={embedded ? "border-0 shadow-none" : ""}>
          <CardHeader>
            <CardTitle>MFA Enabled</CardTitle>
            <CardDescription>
              Multi-Factor Authentication has been successfully set up.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="bg-green-50 text-green-800 p-4 rounded mb-6 dark:bg-green-900/20 dark:text-green-300">
              Your account is now more secure.
            </div>

            {mfaData?.backupCodes && mfaData.backupCodes.length > 0 && (
              <div className="space-y-4">
                <h4 className="font-medium text-sm">Backup Codes</h4>
                <p className="text-sm text-muted-foreground">
                  Save these codes in a secure place. You can use them to access
                  your account if you lose your device.
                </p>
                <div className="grid grid-cols-2 gap-2 bg-muted p-4 rounded">
                  {mfaData.backupCodes.map((code, i) => (
                    <code key={i} className="text-xs font-mono">
                      {code}
                    </code>
                  ))}
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() =>
                    copyToClipboard(mfaData.backupCodes.join("\n"))
                  }
                  className="w-full"
                >
                  Copy All Codes
                </Button>
              </div>
            )}
          </CardContent>
          <CardFooter>
            <Button
              onClick={() => navigate(ROUTES.SETTINGS_ACCOUNT)}
              className="w-full"
            >
              Done
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return null;
}
