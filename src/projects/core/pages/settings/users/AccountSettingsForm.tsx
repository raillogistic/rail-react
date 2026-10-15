import { zodResolver } from "@hookform/resolvers/zod";
import { useEffect } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";
import { gql, useMutation } from "@apollo/client";
import { toast } from "sonner";

import { Button } from "@/shared/ui/kit/button";
import {
  Form,
  FormControl,
  FormDescription,
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
  field?: string | null;
  message: string;
}

interface GraphQLErrorLike {
  message?: string;
}

interface ApolloLikeError {
  message?: string;
  graphQLErrors?: GraphQLErrorLike[];
}

const mapBackendFieldToFormField = (
  field?: string | null,
): keyof AccountFormValues | undefined => {
  if (!field) {
    return undefined;
  }
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

const getApolloErrorMessage = (error: unknown): string | null => {
  const apolloError = error as ApolloLikeError | undefined;
  if (apolloError?.graphQLErrors?.length) {
    return apolloError.graphQLErrors[0]?.message ?? null;
  }
  if (apolloError?.message) {
    return apolloError.message;
  }
  return null;
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
        const globalMessages: string[] = [];
        errors.forEach((error) => {
          const fieldName = mapBackendFieldToFormField(error.field);
          if (fieldName) {
            form.setError(fieldName, { message: error.message });
            return;
          }
          globalMessages.push(error.message);
        });
        if (globalMessages.length > 0) {
          toast.error(globalMessages.join(" | "));
        } else {
          toast.error("Erreur lors de la mise a jour du profil.");
        }
        console.error("updateUser returned errors:", errors);
        return;
      }
      toast.error("Echec de la mise a jour du profil.");
      console.error("updateUser failed without explicit errors:", response);
    } catch (error) {
      const backendMessage = getApolloErrorMessage(error);
      toast.error(backendMessage ?? "Une erreur est survenue.");
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
