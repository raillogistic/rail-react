import React from "react";
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
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/lib/components/ui/card";

const CHANGE_PASSWORD_MUTATION = gql`
  mutation ChangePassword($oldPassword: String!, $newPassword: String!) {
    change_password(old_password: $oldPassword, new_password: $newPassword) {
      ok
      errors
    }
  }
`;

const passwordFormSchema = z.object({
  old_password: z.string().min(1, "L'ancien mot de passe est requis."),
  new_password: z.string().min(8, "Le mot de passe doit contenir au moins 8 caractères."),
  confirm_password: z.string().min(1, "La confirmation est requise."),
}).refine((data) => data.new_password === data.confirm_password, {
  message: "Les mots de passe ne correspondent pas.",
  path: ["confirm_password"],
});

type PasswordFormValues = z.infer<typeof passwordFormSchema>;

export function ChangePasswordForm() {
  const [changePassword, { loading }] = useMutation(CHANGE_PASSWORD_MUTATION);

  const form = useForm<PasswordFormValues>({
    resolver: zodResolver(passwordFormSchema),
    defaultValues: {
      old_password: "",
      new_password: "",
      confirm_password: "",
    },
  });

  async function onSubmit(data: PasswordFormValues) {
    try {
      const response = await changePassword({
        variables: {
          oldPassword: data.old_password,
          newPassword: data.new_password,
        },
      });

      if (response.data?.change_password?.ok) {
        toast.success("Mot de passe modifié avec succès.");
        form.reset();
      } else {
        const errors = response.data?.change_password?.errors;
        if (errors && errors.length > 0) {
          toast.error(errors[0]); // Display first error
        } else {
          toast.error("Erreur lors du changement de mot de passe.");
        }
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
        <CardDescription>
          Modifiez votre mot de passe.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="old_password"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Ancien mot de passe</FormLabel>
                  <FormControl>
                    <Input type="password" placeholder="••••••••" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            <div className="grid grid-cols-2 gap-4">
                <FormField
                control={form.control}
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
                control={form.control}
                name="confirm_password"
                render={({ field }) => (
                    <FormItem>
                    <FormLabel>Confirmer le mot de passe</FormLabel>
                    <FormControl>
                        <Input type="password" placeholder="••••••••" {...field} />
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
