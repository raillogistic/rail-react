import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ROUTES } from "@/routes/links";
import { useAuthContext } from "@/views/providers/AuthProvider";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Eye,
  EyeOff,
  Mail,
  Lock,
  AlertCircle,
  WifiOff,
  Train, // Using Train as placeholder icon if available, otherwise standard icon
} from "lucide-react";
import {
  isServerOfflineError,
  onOfflineStatusChange,
  testServerConnectivity,
} from "@/utils/offline-detector";
import Logo from "@/assets/logos/logo.png";
import Cover from "@/assets/images/cover.jpg";

const loginSchema = z.object({
  username: z.string().min(1, "Le nom d'utilisateur est requis"),
  password: z.string().min(1, "Le mot de passe est requis"),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { login, isLoading, error, clearError } = useAuthContext();
  const [showPassword, setShowPassword] = useState(false);
  const [isServerOnline, setIsServerOnline] = useState(true);
  const [isCheckingConnectivity, setIsCheckingConnectivity] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    reset,
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      username: "",
      password: "",
    },
  });

  useEffect(() => {
    const checkConnectivity = async () => {
      setIsCheckingConnectivity(true);
      const isOnline = await testServerConnectivity();
      setIsServerOnline(isOnline);
      setIsCheckingConnectivity(false);
    };

    checkConnectivity();
    const cleanup = onOfflineStatusChange((isOffline) =>
      setIsServerOnline(!isOffline)
    );
    return cleanup;
  }, []);

  useEffect(() => {
    if (error && isServerOfflineError(error)) {
      const checkConnectivity = async () => {
        setIsCheckingConnectivity(true);
        const isOnline = await testServerConnectivity();
        setIsServerOnline(isOnline);
        setIsCheckingConnectivity(false);
      };
      checkConnectivity();
    }
  }, [error]);

  const onSubmit = async (data: LoginFormData) => {
    try {
      clearError();
      await login(data);
      reset();
    } catch (error) {
      console.error("Login error:", error);
    }
  };

  const handleForgotPassword = () => {
    navigate(ROUTES.FORGOT_PASSWORD);
  };

  return (
    <div className="flex min-h-screen w-full bg-gray-50">
      {/* Left Side - Form */}
      <div className="flex flex-col justify-center w-full lg:w-1/2 px-8 py-12 sm:px-12 lg:px-24 xl:px-32 bg-white">
        <div className="w-full max-w-md mx-auto space-y-8">
          {/* Header */}
          <div className="text-center lg:text-center">
            <div className="inline-flex items-center justify-center w-full rounded-xl  text-white mb-6">
              <img src={Logo} alt="Logo" height={128} width={128} />
            </div>
            <h2 className="text-3xl font-bold text-gray-900 tracking-tight">
              Bienvenue sur Rail Logistics
            </h2>
            <p className="mt-2 text-gray-500 text-base">
              Connectez-vous pour accéder à votre espace de maintenance.
            </p>
          </div>

          {/* Alerts */}
          {!isServerOnline && (
            <div className="p-4 rounded-lg bg-orange-50 border border-orange-200 flex items-start gap-3">
              <WifiOff className="h-5 w-5 text-orange-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-orange-800">
                  Serveur inaccessible
                </h3>
                <p className="text-sm text-orange-600 mt-1">
                  Impossible de joindre le serveur. Vérifiez votre connexion
                  internet.
                </p>
              </div>
            </div>
          )}

          {error && (
            <div className="p-4 rounded-lg bg-red-50 border border-red-200 flex items-start gap-3">
              <AlertCircle className="h-5 w-5 text-red-500 mt-0.5 shrink-0" />
              <div>
                <h3 className="text-sm font-semibold text-red-800">
                  Erreur de connexion
                </h3>
                <p className="text-sm text-red-600 mt-1">
                  {error.userMessage ||
                    error.message ||
                    "Une erreur est survenue."}
                </p>
              </div>
            </div>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
            <div className="space-y-5">
              {/* Username Input */}
              <div>
                <label
                  htmlFor="username"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Nom d'utilisateur
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Mail className="h-5 w-5" />
                  </div>
                  <input
                    {...register("username")}
                    type="text"
                    id="username"
                    className={`
                      block w-full pl-10 pr-3 py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:bg-white transition-all duration-200 ease-in-out outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
                      ${
                        errors.username
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200"
                      }
                    `}
                    placeholder="Entrez votre identifiant"
                  />
                </div>
                {errors.username && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.username.message}
                  </p>
                )}
              </div>

              {/* Password Input */}
              <div>
                <label
                  htmlFor="password"
                  className="block text-sm font-medium text-gray-700 mb-1.5"
                >
                  Mot de passe
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-gray-400 group-focus-within:text-blue-600 transition-colors">
                    <Lock className="h-5 w-5" />
                  </div>
                  <input
                    {...register("password")}
                    type={showPassword ? "text" : "password"}
                    id="password"
                    className={`
                      block w-full pl-10 pr-10 py-3 bg-gray-50 border rounded-lg text-gray-900 text-sm placeholder-gray-400 focus:bg-white transition-all duration-200 ease-in-out outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-600
                      ${
                        errors.password
                          ? "border-red-300 focus:border-red-500 focus:ring-red-500/20"
                          : "border-gray-200"
                      }
                    `}
                    placeholder="Entrez votre mot de passe"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 transition-colors focus:outline-none"
                  >
                    {showPassword ? (
                      <EyeOff className="h-5 w-5" />
                    ) : (
                      <Eye className="h-5 w-5" />
                    )}
                  </button>
                </div>
                {errors.password && (
                  <p className="mt-1.5 text-sm text-red-600 flex items-center gap-1">
                    <AlertCircle size={14} /> {errors.password.message}
                  </p>
                )}
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="text-sm">
                <button
                  type="button"
                  onClick={handleForgotPassword}
                  className="font-medium text-blue-600 hover:text-blue-500 hover:underline transition-all"
                >
                  Mot de passe oublié ?
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || isLoading || !isServerOnline}
              className={`
                w-full py-3 px-4 border border-transparent rounded-lg shadow-sm text-sm font-semibold text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-all duration-200 transform active:scale-[0.98]
                ${
                  isSubmitting || isLoading || !isServerOnline
                    ? "opacity-75 cursor-not-allowed"
                    : ""
                }
              `}
            >
              {isSubmitting || isLoading
                ? "Connexion en cours..."
                : "Se connecter"}
            </button>
          </form>

          <div className="mt-8 pt-6 border-t border-gray-100 text-center">
            <p className="text-xs text-gray-400">
              &copy; {new Date().getFullYear()} Rail Logistics. Tous droits
              réservés.
            </p>
          </div>
        </div>
      </div>

      {/* Right Side - Image */}
      <div className="hidden lg:block lg:w-1/2 relative overflow-hidden">
        <div className="absolute inset-0 bg-blue-900/20 z-10 mix-blend-multiply"></div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent z-20"></div>
        <img
          src={Cover}
          alt="Maintenance ferroviaire"
          className="absolute inset-0 w-full h-full object-cover"
        />
        <div className="absolute bottom-0 left-0 right-0 p-12 z-30 text-white">
          <h3 className="text-2xl font-bold mb-2">Excellence Opérationnelle</h3>
          <p className="text-blue-100 max-w-md text-lg leading-relaxed">
            Une plateforme unifiée pour la gestion de la maintenance, assurant
            fiabilité et sécurité sur l'ensemble du réseau ferroviaire.
          </p>
        </div>
      </div>
    </div>
  );
};
