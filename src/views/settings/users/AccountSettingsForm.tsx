import React from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { Button } from "@/lib/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/lib/components/ui/form";
import { Input } from "@/lib/components/ui/input";
import { Textarea } from "@/lib/components/ui/textarea";
import { toast } from "sonner";
import { gql, useMutation } from "@apollo/client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($input: UpdateUserInput!) {
    update_user(input: $input) {
      ok
      errors {
        field
        message
      }
      object {
        id
        first_name
        last_name
        email
      }
    }
  }
`;

const accountFormSchema = z.object({
  first_name: z.string().min(2, {
    message: "Le prénom doit contenir au moins 2 caractères.",
  }),
  last_name: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caractères.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountSettingsFormProps {
  user: any;
}

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [updateUser, { loading }] = useMutation(UPDATE_USER_MUTATION);

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      first_name: user?.first_name || "",
      last_name: user?.last_name || "",
      email: user?.email || "",
    },
  });

  async function onSubmit(data: AccountFormValues) {
    try {
      const response = await updateUser({
        variables: {
          input: {
            id: user.id,
            ...data,
          },
        },
      });

      if (response.data?.update_user?.ok) {
        toast.success("Profil mis à jour avec succès.");
      } else {
        const errors = response.data?.update_user?.errors;
        if (errors) {
          errors.forEach((e: any) => {
            form.setError(e.field as any, { message: e.message });
          });
          toast.error("Erreur lors de la mise à jour du profil.");
        }
      }
    } catch (error) {
      toast.error("Une erreur est survenue.");
      console.error(error);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Profil</CardTitle>
        <CardDescription>
          Mettez à jour vos informations personnelles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="first_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prénom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre prénom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="last_name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre nom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="email"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Email</FormLabel>
                  <FormControl>
                    <Input placeholder="votre@email.com" {...field} />
                  </FormControl>
                  <FormDescription>
                    Ceci est l'email utilisé pour la connexion et les
                    notifications.
                  </FormDescription>
                                    <FormMessage />
                                  </FormItem>
                                )}
                              />
                              <Button type="submit" disabled={loading}>
                                  {loading ? "Enregistrement..." : "Mettre à jour le profil"}
                              </Button>
                  
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
