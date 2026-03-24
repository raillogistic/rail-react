import React, { useState } from 'react';
import { ShieldCheck, Smartphone, Mail, KeyRound, ArrowRight, Loader2, Lock } from 'lucide-react';
import { cn } from '@/shared/utils';

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
    if (code.length === 6) {
      await onVerify(code);
    }
  };

  const getIcon = () => {
    switch (method) {
      case 'totp': return <Smartphone className="h-6 w-6 text-primary" />;
      case 'sms': return <Smartphone className="h-6 w-6 text-primary" />;
      case 'email': return <Mail className="h-6 w-6 text-primary" />;
      case 'webauthn': return <KeyRound className="h-6 w-6 text-primary" />;
      default: return <ShieldCheck className="h-6 w-6 text-primary" />;
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex flex-col items-center text-center">
        <div className="h-16 w-16 rounded-2xl bg-primary/5 flex items-center justify-center mb-6 ring-1 ring-primary/20 shadow-[0_0_20px_rgba(var(--primary),0.1)]">
          {getIcon()}
        </div>
        <h3 className="text-2xl font-bold tracking-tight text-foreground">Double sécurité</h3>
        <p className="text-sm text-muted-foreground mt-2 max-w-[280px]">
          {method === 'totp' 
            ? "Saisissez le code généré par votre application d'authentification."
            : `Un code a été envoyé à votre ${method === 'email' ? 'adresse e-mail' : 'mobile'}.`}
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        <div className="space-y-4">
          <div className="flex justify-center gap-2 sm:gap-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="relative group">
                <input
                  type="text"
                  maxLength={1}
                  className={cn(
                    "w-10 h-14 sm:w-12 sm:h-16 text-center text-2xl font-bold rounded-xl bg-muted/30 border-2 border-transparent outline-none",
                    "focus:border-primary focus:bg-background focus:shadow-[0_0_15px_rgba(var(--primary),0.1)]",
                    code[i] ? "border-primary/50 bg-background" : "group-hover:bg-muted/50",
                    error ? "border-destructive/50" : ""
                  )}
                  value={code[i] || ''}
                  onChange={(e) => {
                    const val = e.target.value.replace(/[^0-9]/g, '');
                    if (val) {
                      const newCode = code.split('');
                      newCode[i] = val[val.length - 1];
                      const finalCode = newCode.join('');
                      setCode(finalCode);
                      // Auto focus next
                      if (i < 5) {
                        const next = e.target.parentElement?.nextElementSibling?.querySelector('input');
                        next?.focus();
                      }
                    }
                  }}
                  onKeyDown={(e) => {
                    if (e.key === 'Backspace' && !code[i] && i > 0) {
                      const target = e.target as HTMLInputElement;
                      const prev = target.parentElement?.previousElementSibling?.querySelector('input');
                      prev?.focus();
                    }
                  }}
                  disabled={isLoading}
                  autoFocus={i === 0}
                />
                {i === 2 && <div className="w-1 h-1 rounded-full bg-muted-foreground/30 self-center mx-1 hidden sm:block" />}
              </div>
            ))}
          </div>
          
          {error && (
            <p className="text-center text-sm font-medium text-destructive">
              {error}
            </p>
          )}
        </div>

        <div className="flex flex-col gap-4">
          <button
            type="submit"
            disabled={isLoading || code.length < 6}
            className={cn(
              "relative overflow-hidden h-14 w-full rounded-2xl font-bold text-lg disabled:opacity-50 disabled:active:scale-100",
              "bg-primary text-primary-foreground shadow-[0_10px_20px_-5px_rgba(var(--primary),0.3)]",
            )}
          >
            {isLoading ? (
              <Loader2 className="h-6 w-6 mx-auto" />
            ) : (
              <span className="flex items-center justify-center gap-2">
                Valider l'accès <ArrowRight className="h-5 w-5" />
              </span>
            )}
          </button>
          
          <button
            type="button"
            onClick={onCancel}
            className="h-10 text-sm font-semibold text-muted-foreground hover:text-foreground"
          >
            Retour à l'identification
          </button>
        </div>
      </form>

      <div className="flex items-center justify-center gap-2 text-[10px] text-muted-foreground uppercase tracking-widest font-bold opacity-50">
        <Lock className="h-3 w-3" />
        SÉCURITÉ CHIFFRÉE DE BOUT EN BOUT
      </div>
    </div>
  );
}
