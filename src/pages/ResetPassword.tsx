import { useEffect, useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import PasswordInput from "@/components/PasswordInput";
import { authErrorMessage } from "@/lib/authErrors";

type Status = "checking" | "ready" | "invalid";

/** Page ouverte depuis le lien « Mot de passe oublié » reçu par email. */
export default function ResetPassword() {
  const [status, setStatus] = useState<Status>("checking");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    document.title = "Nouveau mot de passe | Sunu Derma";

    // Lien expiré ou déjà utilisé : Supabase l'indique dans l'URL.
    const params = new URLSearchParams(window.location.hash.slice(1) || window.location.search);
    if (params.get("error") || params.get("error_code")) {
      setStatus("invalid");
      return;
    }

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === "PASSWORD_RECOVERY" || session) setStatus("ready");
    });
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) setStatus("ready");
    });
    // Sans session après quelques secondes, le lien n'est pas valide.
    const timer = setTimeout(() => setStatus((s) => (s === "checking" ? "invalid" : s)), 5000);

    return () => {
      subscription.unsubscribe();
      clearTimeout(timer);
    };
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (password !== confirm) {
      toast({ title: "Oups", description: "Les deux mots de passe ne sont pas identiques.", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const { error } = await supabase.auth.updateUser({ password });
      if (error) throw error;
      toast({ title: "Mot de passe modifié", description: "Vous êtes connecté(e)." });
      navigate("/redirect");
    } catch (err: unknown) {
      toast({ title: "Oups", description: authErrorMessage(err), variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center p-8">
      <div className="w-full max-w-md">
        <Link to="/auth" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
          <ArrowLeft className="h-4 w-4" />
          Connexion
        </Link>

        <h2 className="text-3xl font-display font-bold mb-2">Nouveau mot de passe</h2>

        {status === "checking" && (
          <div className="flex items-center gap-3 text-muted-foreground mt-6">
            <Loader2 className="h-5 w-5 animate-spin" /> Vérification du lien...
          </div>
        )}

        {status === "invalid" && (
          <div className="space-y-5 mt-6">
            <p className="text-muted-foreground">
              Ce lien a expiré ou a déjà été utilisé. Demandez-en un nouveau depuis la page de connexion,
              avec « Mot de passe oublié ? ».
            </p>
            <Button asChild className="w-full" size="lg">
              <Link to="/auth">Retour à la connexion</Link>
            </Button>
          </div>
        )}

        {status === "ready" && (
          <form onSubmit={handleSubmit} className="space-y-5 mt-6">
            <div>
              <Label htmlFor="new-password">Nouveau mot de passe</Label>
              <PasswordInput
                id="new-password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
              <p className="text-xs text-muted-foreground mt-1">Au moins 8 caractères.</p>
            </div>
            <div>
              <Label htmlFor="confirm-password">Confirmer le mot de passe</Label>
              <PasswordInput
                id="confirm-password"
                value={confirm}
                onChange={(e) => setConfirm(e.target.value)}
                required
                minLength={8}
                autoComplete="new-password"
                className="mt-1.5"
              />
            </div>
            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Enregistrement..." : "Enregistrer"}
            </Button>
          </form>
        )}
      </div>
    </div>
  );
}
