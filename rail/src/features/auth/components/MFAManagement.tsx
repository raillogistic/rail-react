import React, { useState } from "react";
import { useQuery, useMutation } from "@apollo/client";
import { GET_MFA_STATUS } from "@/shared/api/graphql/legacy/queries";
import { DISABLE_MFA_MUTATION } from "@/shared/api/graphql/legacy/mutations";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";
import { Button } from "@/shared/ui/kit/button";
import { Badge } from "@/shared/ui/kit/badge";
import { Shield } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/shared/ui/kit/dialog";
import { Label } from "@/shared/ui/kit/label";
import { Input } from "@/shared/ui/kit/input";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/shared/routing/routes";

export function MFAManagement() {
  const { data: mfaData, loading, refetch } = useQuery(GET_MFA_STATUS);
  const [disableMFA] = useMutation(DISABLE_MFA_MUTATION);
  const [showDisableDialog, setShowDisableDialog] = useState(false);
  const [password, setPassword] = useState("");
  const navigate = useNavigate();

  const mfaEnabled = mfaData?.me?.mfa_enabled;

  const handleDisableMFA = async () => {
    try {
      await disableMFA({ variables: { password } });
      await refetch();
      setShowDisableDialog(false);
      setPassword("");
    } catch (error) {
      console.error("Failed to disable MFA:", error);
    }
  };

  if (loading) {
    return <div>Loading...</div>;
  }

  return (
    <div className="space-y-6">
      {/* Status Card */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Shield className="h-5 w-5" />
                Two-Factor Authentication
              </CardTitle>
              <CardDescription>
                Add an extra layer of security to your account
              </CardDescription>
            </div>
            <Badge variant={mfaEnabled ? "default" : "destructive"}>
              {mfaEnabled ? "Enabled" : "Disabled"}
            </Badge>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {!mfaEnabled ? (
            <div>
              <p className="text-sm text-muted-foreground mb-4">
                Protect your account by requiring a verification code in
                addition to your password.
              </p>
              <Button onClick={() => navigate(ROUTES.SETTINGS_MFA || "/settings/mfa")}>
                Enable Two-Factor Authentication
              </Button>
            </div>
          ) : (
            <>
              <p className="text-sm text-muted-foreground">
                Your account is currently protected with Two-Factor Authentication.
              </p>

              {/* Disable MFA */}
              <div className="pt-4 border-t mt-4">
                <Button
                  variant="destructive"
                  onClick={() => setShowDisableDialog(true)}
                >
                  Disable Two-Factor Authentication
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Disable Dialog */}
      {showDisableDialog && (
        <Dialog open={showDisableDialog} onOpenChange={setShowDisableDialog}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Disable Two-Factor Authentication?</DialogTitle>
              <DialogDescription>
                This will make your account less secure. Enter your password to
                confirm.
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Enter your password"
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setShowDisableDialog(false)}
              >
                Cancel
              </Button>
              <Button
                variant="destructive"
                onClick={handleDisableMFA}
                disabled={!password}
              >
                Disable MFA
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}


