import { useState, useEffect } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/lib/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/components/ui/form";
import { Input } from "@/lib/components/ui/input";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { ROUTES } from "@/shared/routing/paths";
const VALIDATE_RESET_CODE_MUTATION = gql`
  mutation ValidateResetCode($email: String!, $code: String!) {
    validate_reset_code: validateResetCode(email: $email, code: $code) {
      ok
      errors
    }
  }
`;

const CONFIRM_PASSWORD_RESET_MUTATION = gql`
  mutation ConfirmPasswordReset(
    $email: String!
    $code: String!
    $newPassword: String!
  ) {
    confirm_password_reset: confirmPasswordReset(
      email: $email
      code: $code
      newPassword: $newPassword
    ) {
      ok
      errors
    }
  }
`;

const codeSchema = z.object({
  code: z.string().length(6, "Le code doit contenir 6 chiffres."),
});

const passwordSchema = z.object({
  new_password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  confirm_password: z.string().min(1, "La confirmation est requise."),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirm_password"],
});

export function ResetPasswordPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const email = location.state?.email;

  const [step, setStep] = useState<"code" | "password">("code");
  const [verifiedCode, setVerifiedCode] = useState("");

  const [validateCode, { loading: validating }] = useMutation(VALIDATE_RESET_CODE_MUTATION);
  const [confirmReset, { loading: confirming }] = useMutation(CONFIRM_PASSWORD_RESET_MUTATION);

  // Redirect if no email
  useEffect(() => {
    if (!email) {
        toast.error("Email manquant. Veuillez recommencer.");
        navigate(ROUTES.FORGOT_PASSWORD);
    }
  }, [email, navigate]);

  const codeForm = useForm({
    resolver: zodResolver(codeSchema),
    defaultValues: { code: "" },
  });

  const passwordForm = useForm({
    resolver: zodResolver(passwordSchema),
    defaultValues: { new_password: "", confirm_password: "" },
  });

  async function onVerifyCode(data: { code: string }) {
    try {
      const response = await validateCode({
        variables: { email, code: data.code },
      });

      if (response.data?.validate_reset_code?.ok) {
        setVerifiedCode(data.code);
        setStep("password");
        toast.success("Code vérifié.");
      } else {
        toast.error(response.data?.validate_reset_code?.errors[0] || "Code invalide.");
      }
    } catch {
      toast.error("Erreur lors de la vérification.");
    }
  }

  async function onResetPassword(data: { new_password: string; confirm_password: string }) {
    try {
      const response = await confirmReset({
        variables: {
          email,
          code: verifiedCode,
          newPassword: data.new_password,
        },
      });

      if (response.data?.confirm_password_reset?.ok) {
        toast.success("Mot de passe réinitialisé avec succès.");
        navigate(ROUTES.LOGIN);
      } else {
        toast.error(response.data?.confirm_password_reset?.errors[0] || "Erreur lors de la réinitialisation.");
      }
    } catch {
      toast.error("Erreur serveur.");
    }
  }

  if (!email) return null;

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md">
        <div className="text-center">
          <h2 className="mt-6 text-3xl font-extrabold text-gray-900">
            Réinitialisation
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            {step === "code" ? `Entrez le code reçu par email pour ${email}` : "Choisissez un nouveau mot de passe"}
          </p>
        </div>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-white py-8 px-4 shadow sm:rounded-lg sm:px-10">
          {step === "code" ? (
            <Form {...codeForm} key="code-form">
              <form onSubmit={codeForm.handleSubmit(onVerifyCode)} className="space-y-6">
                <FormField
                  control={codeForm.control}
                  name="code"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Code à 6 chiffres</FormLabel>
                      <FormControl>
                        <Input placeholder="123456" {...field} maxLength={6} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={validating}>
                  {validating ? "Vérification..." : "Vérifier le code"}
                </Button>
              </form>
            </Form>
          ) : (
            <Form {...passwordForm} key="password-form">
              <form onSubmit={passwordForm.handleSubmit(onResetPassword)} className="space-y-6">
                <FormField
                  control={passwordForm.control}
                  name="new_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Nouveau mot de passe</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={passwordForm.control}
                  name="confirm_password"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Confirmer</FormLabel>
                      <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <Button type="submit" className="w-full" disabled={confirming}>
                  {confirming ? "Réinitialisation..." : "Changer le mot de passe"}
                </Button>
              </form>
            </Form>
          )}
          
          <div className="mt-6 text-center">
            <Link to={ROUTES.LOGIN} className="font-medium text-blue-600 hover:text-blue-500">
                Annuler
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}


