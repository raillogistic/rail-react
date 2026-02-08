import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { gql, useMutation } from "@apollo/client";
import { toast } from "sonner";

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
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";

const UPDATE_USER_MUTATION = gql`
  mutation UpdateUser($id: ID!, $input: UpdateUserInput!) {
    updateUser(id: $id, input: $input) {
      ok
      errors {
        field
        message
      }
      object {
        id
        firstName
        lastName
        email
      }
    }
  }
`;

const accountFormSchema = z.object({
  firstName: z.string().min(2, {
    message: "Le prenom doit contenir au moins 2 caracteres.",
  }),
  lastName: z.string().min(2, {
    message: "Le nom doit contenir au moins 2 caracteres.",
  }),
  email: z.string().email({
    message: "Veuillez entrer une adresse email valide.",
  }),
});

type AccountFormValues = z.infer<typeof accountFormSchema>;

interface AccountSettingsFormProps {
  user: {
    id: string;
    firstName?: string | null;
    lastName?: string | null;
    first_name?: string | null;
    last_name?: string | null;
    email?: string | null;
  };
}

interface MutationError {
  field: string;
  message: string;
}

const mapBackendFieldToFormField = (
  field: string,
): keyof AccountFormValues | undefined => {
  const normalized = field.replace(/_([a-z])/g, (_, c: string) =>
    c.toUpperCase(),
  );
  if (
    normalized === "firstName" ||
    normalized === "lastName" ||
    normalized === "email"
  ) {
    return normalized;
  }
  return undefined;
};

export function AccountSettingsForm({ user }: AccountSettingsFormProps) {
  const [updateUser, { loading }] = useMutation(UPDATE_USER_MUTATION);
  const resolvedFirstName = user?.firstName ?? user?.first_name ?? "";
  const resolvedLastName = user?.lastName ?? user?.last_name ?? "";
  const resolvedEmail = user?.email ?? "";

  const form = useForm<AccountFormValues>({
    resolver: zodResolver(accountFormSchema),
    defaultValues: {
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: resolvedEmail,
    },
  });

  useEffect(() => {
    form.reset({
      firstName: resolvedFirstName,
      lastName: resolvedLastName,
      email: resolvedEmail,
    });
  }, [form, resolvedFirstName, resolvedLastName, resolvedEmail]);

  async function onSubmit(data: AccountFormValues) {
    try {
      const response = await updateUser({
        variables: {
          id: user.id,
          input: data,
        },
      });

      if (response.data?.updateUser?.ok) {
        toast.success("Profil mis a jour avec succes.");
        return;
      }

      const errors: MutationError[] | undefined =
        response.data?.updateUser?.errors;
      if (errors?.length) {
        errors.forEach((error) => {
          const fieldName = mapBackendFieldToFormField(error.field);
          if (fieldName) {
            form.setError(fieldName, { message: error.message });
          }
        });
        toast.error("Erreur lors de la mise a jour du profil.");
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
          Mettez a jour vos informations personnelles.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="firstName"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Prenom</FormLabel>
                    <FormControl>
                      <Input placeholder="Votre prenom" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                control={form.control}
                name="lastName"
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
                    Ceci est l&apos;email utilise pour la connexion et les
                    notifications.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            <Button type="submit" disabled={loading}>
              {loading ? "Enregistrement..." : "Mettre a jour le profil"}
            </Button>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}
