import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { User, ArrowLeft } from "lucide-react";
import PasswordInput from "@/components/PasswordInput";
import { authErrorMessage } from "@/lib/authErrors";
import { Link } from "react-router-dom";

export default function Auth() {
  const [mode, setMode] = useState<"login" | "signup" | "forgot">("login");
  const isLogin = mode === "login";
  const [resetSent, setResetSent] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole] = useState<"patient">("patient");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp, sendPasswordReset } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (mode === "forgot") {
        await sendPasswordReset(email);
        setResetSent(true);
      } else if (isLogin) {
        await signIn(email, password);
        navigate("/redirect");
      } else {
        const loggedIn = await signUp(email, password, fullName, selectedRole);
        if (loggedIn) {
          toast({ title: "Bienvenue sur Sunu Derma !" });
          navigate("/redirect");
        } else {
          toast({
            title: "Inscription réussie !",
            description: "Ouvrez le lien reçu par email pour activer votre compte.",
          });
          setMode("login");
        }
      }
    } catch (err: unknown) {
      toast({
        title: "Oups",
        description: authErrorMessage(err),
        variant: "destructive",
      });
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="flex min-h-screen">
      {/* Left panel */}
      <div className="hidden lg:flex lg:w-1/2 bg-gradient-hero items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-20 left-20 w-64 h-64 rounded-full bg-accent/20 blur-3xl animate-float" />
          <div className="absolute bottom-20 right-20 w-80 h-80 rounded-full bg-primary/20 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
        </div>
        <div className="relative z-10 text-center px-12">
          <h1 className="text-5xl font-display font-bold text-primary-foreground mb-4">
            Sunu <span className="text-gradient-gold">Derma</span>
          </h1>
          <p className="text-lg text-primary-foreground/70 max-w-md">
            Votre plateforme de dermatologie intelligente. Analyse IA, consultations en temps réel et soins personnalisés.
          </p>
        </div>
      </div>

      {/* Right panel - form */}
      <div className="flex-1 flex items-center justify-center p-8">
        <div className="w-full max-w-md">
          <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-primary mb-8 transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Retour
          </Link>

          <h2 className="text-3xl font-display font-bold mb-2">
            {mode === "forgot" ? "Mot de passe oublié" : isLogin ? "Connexion" : "Inscription"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {mode === "forgot"
              ? "Entrez votre email : nous vous envoyons un lien pour choisir un nouveau mot de passe."
              : isLogin ? "Accédez à votre espace personnel" : "Créez votre compte Sunu Derma"}
          </p>

          {mode === "forgot" && resetSent ? (
            <div className="space-y-5">
              <div className="p-4 rounded-lg bg-secondary text-sm">
                Si un compte existe avec <strong>{email}</strong>, vous allez recevoir un email avec un lien.
                Pensez à regarder dans les spams.
              </div>
              <Button className="w-full" size="lg" onClick={() => { setResetSent(false); setMode("login"); }}>
                Retour à la connexion
              </Button>
            </div>
          ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            {mode === "signup" && (
              <>
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Aminata Diop"
                    required
                    className="mt-1.5"
                  />
                </div>

                <div>
                  <Label>Je suis</Label>
                  <div className="grid grid-cols-1 gap-3 mt-1.5">
                    <div
                      className="flex items-center gap-3 p-4 rounded-lg border-2 border-primary bg-secondary"
                    >
                      <User className="h-5 w-5 text-primary" />
                      <span className="font-medium">Patient</span>
                    </div>
                    <p className="text-xs text-muted-foreground">
                      Vous êtes médecin ? Contactez l'administration pour obtenir un accès professionnel.
                    </p>
                  </div>
                </div>
              </>
            )}

            <div>
              <Label htmlFor="email">Email</Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="vous@email.com"
                required
                className="mt-1.5"
              />
            </div>

            {mode !== "forgot" && (
            <div>
              <div className="flex items-center justify-between">
                <Label htmlFor="password">Mot de passe</Label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => setMode("forgot")}
                    className="text-sm text-primary hover:underline"
                  >
                    Mot de passe oublié ?
                  </button>
                )}
              </div>
              <PasswordInput
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={isLogin ? undefined : 8}
                autoComplete={isLogin ? "current-password" : "new-password"}
                className="mt-1.5"
              />
              {!isLogin && <p className="text-xs text-muted-foreground mt-1">Au moins 8 caractères.</p>}
            </div>
            )}

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting
                ? "Chargement..."
                : mode === "forgot" ? "Envoyer le lien" : isLogin ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>
          )}

          <p className="text-center mt-6 text-muted-foreground">
            {mode === "forgot" ? (
              <button onClick={() => { setResetSent(false); setMode("login"); }} className="text-primary font-semibold hover:underline">
                Retour à la connexion
              </button>
            ) : (
              <>
                {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
                <button
                  onClick={() => setMode(isLogin ? "signup" : "login")}
                  className="text-primary font-semibold hover:underline"
                >
                  {isLogin ? "S'inscrire" : "Se connecter"}
                </button>
              </>
            )}
          </p>
        </div>
      </div>
    </div>
  );
}
