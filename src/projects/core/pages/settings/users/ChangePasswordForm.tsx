import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { gql, useMutation } from "@apollo/client";
import { toast } from "sonner";

import { Button } from "@/shared/ui/kit/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/shared/ui/kit/form";
import { Input } from "@/shared/ui/kit/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/shared/ui/kit/card";

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    changePassword(oldPassword: $oldPassword, newPassword: $newPassword) {
      ok
      errors
    }
  }
`;

const passwordFormSchema = z
  .object({
    oldPassword: z.string().min(1, "L'ancien mot de passe est requis."),
    newPassword: z.string().min(8, "Le mot de passe doit contenir au moins 8 caracteres."),
    confirmPassword: z.string().min(1, "La confirmation est requise."),
  })
  .refine((data) => data.newPassword === data.confirmPassword, {
    message: "Les mots de passe ne correspondent pas.",
    path: ["confirmPassword"],
  });

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ChangePasswordForm() {
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD_MUTATION);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      oldPassword: "",
      newPassword: "",
      confirmPassword: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    try {
      const response = await changePassword({
        variables: {
          oldPassword: data.oldPassword,
          newPassword: data.newPassword,
        },
      });

      if (response.data?.changePassword?.ok) {
        toast.success("Mot de passe modifie avec succes.");
        form.reset();
        return;
      }

      const errors = response.data?.changePassword?.errors;
      if (errors?.length) {
        toast.error(errors[0]);
      } else {
        toast.error("Erreur lors du changement de mot de passe.");
      }
    } catch (error) {
      toast.error("Une erreur est survenue.");
      console.error(error);
    }
  }

  return (
    <Card className="mt-6">
      <CardHeader>
        <CardTitle>Mot de passe</CardTitle>
        <CardDescription>Modifiez votre mot de passe.</CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="oldPassword"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ancien mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="********" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="newPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nouveau mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="confirmPassword"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                      <Input type="password" placeholder="********" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <Button type="submit" disabled={loading}>
              {loading ? "Modification..." : "Modifier le mot de passe"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
