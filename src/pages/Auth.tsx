import { usePageMeta } from "@/lib/seo";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useToast } from "@/hooks/use-toast";
import { Stethoscope, User, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function Auth() {
  usePageMeta("Connexion et inscription", "Créez votre compte Sunu Derma gratuitement : analyse de peau IA, conseils skincare et rendez-vous avec un dermatologue.", "/auth");
  const [isLogin, setIsLogin] = useState(true);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fullName, setFullName] = useState("");
  const [selectedRole] = useState<"patient">("patient");
  const [submitting, setSubmitting] = useState(false);
  const { signIn, signUp } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (isLogin) {
        await signIn(email, password);
        navigate("/redirect");
      } else {
        await signUp(email, password, fullName, selectedRole);
        toast({
          title: "Inscription réussie !",
          description: "Vérifiez votre email pour confirmer votre compte.",
        });
      }
    } catch (err: any) {
      toast({
        title: "Erreur",
        description: err.message,
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
            {isLogin ? "Connexion" : "Inscription"}
          </h2>
          <p className="text-muted-foreground mb-8">
            {isLogin ? "Accédez à votre espace personnel" : "Créez votre compte Sunu Derma"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-5">
            {!isLogin && (
              <>
                <div>
                  <Label htmlFor="fullName">Nom complet</Label>
                  <Input
                    id="fullName"
                    value={fullName}
                    onChange={(e) => setFullName(e.target.value)}
                    placeholder="Dr. Aminata Diop"
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

            <div>
              <Label htmlFor="password">Mot de passe</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                minLength={6}
                className="mt-1.5"
              />
            </div>

            <Button type="submit" className="w-full" size="lg" disabled={submitting}>
              {submitting ? "Chargement..." : isLogin ? "Se connecter" : "S'inscrire"}
            </Button>
          </form>

          <p className="text-center mt-6 text-muted-foreground">
            {isLogin ? "Pas encore de compte ?" : "Déjà un compte ?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-primary font-semibold hover:underline"
            >
              {isLogin ? "S'inscrire" : "Se connecter"}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
}
