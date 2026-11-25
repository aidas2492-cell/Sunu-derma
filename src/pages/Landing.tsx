import { Link } from "react-router-dom";
import { useState, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import {
  Sparkles, Shield, MessageCircle, Pill, ArrowRight, Star,
  Camera, ShoppingBag, Stethoscope, ChevronLeft, ChevronRight,
  Users, Zap, Heart, CheckCircle
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";

const features = [
  {
    icon: Sparkles,
    title: "Analyse IA",
    description: "Uploadez votre photo et recevez une analyse personnalisée de votre peau en quelques secondes.",
  },
  {
    icon: MessageCircle,
    title: "Consultations Live",
    description: "Échangez en temps réel avec des dermatologues certifiés directement depuis l'application.",
  },
  {
    icon: Pill,
    title: "Routine sur mesure",
    description: "Recevez des prescriptions et des routines de soins adaptées à votre type de peau.",
  },
  {
    icon: Shield,
    title: "Données sécurisées",
    description: "Vos informations médicales sont protégées et chiffrées de bout en bout.",
  },
];

const heroSlides = [
  {
    image: "https://images.unsplash.com/photo-1616394584738-fc6e612e71b9?w=1200&q=80",
    title: "Analyse IA de votre peau",
    subtitle: "Scanner intelligent en quelques secondes",
    icon: Camera,
  },
  {
    image: "https://images.unsplash.com/photo-1612817288484-6f916006741a?w=1200&q=80",
    title: "Produits Skincare Premium",
    subtitle: "Les meilleurs soins sélectionnés pour vous",
    icon: ShoppingBag,
  },
  {
    image: "https://images.unsplash.com/photo-1559757175-0eb30cd8c063?w=1200&q=80",
    title: "Consultations Dermatologues",
    subtitle: "Médecins certifiés en temps réel",
    icon: Stethoscope,
  },
  {
    image: "https://images.unsplash.com/photo-1598440947619-2c35fc9aa908?w=1200&q=80",
    title: "Routines Personnalisées",
    subtitle: "Matin & soir, adaptées à votre peau",
    icon: Pill,
  },
];

const testimonials = [
  { name: "Aminata D.", role: "Patiente", text: "Grâce à Sunu Derma, j'ai enfin trouvé la routine idéale pour ma peau. L'analyse IA est bluffante !", avatar: "A" },
  { name: "Dr. Moussa N.", role: "Dermatologue", text: "L'outil parfait pour suivre mes patients à distance. La messagerie live est un game-changer.", avatar: "M" },
  { name: "Fatou S.", role: "Patiente", text: "Les produits recommandés sont de qualité et les prix sont très abordables. Je recommande !", avatar: "F" },
];

const stats = [
  { value: "5 000+", label: "Patients actifs", icon: Users },
  { value: "50+", label: "Dermatologues", icon: Stethoscope },
  { value: "25+", label: "Produits premium", icon: ShoppingBag },
  { value: "98%", label: "Satisfaction", icon: Heart },
];

function HeroCarousel() {
  const [current, setCurrent] = useState(0);
  const [isTransitioning, setIsTransitioning] = useState(false);

  const goTo = useCallback((index: number) => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrent(index);
    setTimeout(() => setIsTransitioning(false), 700);
  }, [isTransitioning]);

  const next = useCallback(() => goTo((current + 1) % heroSlides.length), [current, goTo]);
  const prev = useCallback(() => goTo((current - 1 + heroSlides.length) % heroSlides.length), [current, goTo]);

  useEffect(() => {
    const timer = setInterval(next, 5000);
    return () => clearInterval(timer);
  }, [next]);

  return (
    <div className="relative w-full h-[500px] md:h-[600px] rounded-2xl overflow-hidden group">
      {heroSlides.map((slide, i) => (
        <div
          key={i}
          className="absolute inset-0 transition-all duration-700 ease-in-out"
          style={{
            opacity: i === current ? 1 : 0,
            transform: i === current ? "scale(1)" : "scale(1.05)",
          }}
        >
          <img
            src={slide.image}
            alt={slide.title}
            className="w-full h-full object-cover"
            loading={i === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 p-8 md:p-12">
            <div className="flex items-center gap-3 mb-3">
              <div className="w-12 h-12 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center">
                <slide.icon className="h-6 w-6 text-white" />
              </div>
              <div>
                <h3 className="text-2xl md:text-3xl font-display font-bold text-white">{slide.title}</h3>
                <p className="text-white/70 text-sm md:text-base">{slide.subtitle}</p>
              </div>
            </div>
          </div>
        </div>
      ))}

      {/* Navigation arrows */}
      <button
        onClick={prev}
        className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
      >
        <ChevronLeft className="h-5 w-5" />
      </button>
      <button
        onClick={next}
        className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-white/20 backdrop-blur-md flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity hover:bg-white/30"
      >
        <ChevronRight className="h-5 w-5" />
      </button>

      {/* Dots */}
      <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex gap-2">
        {heroSlides.map((_, i) => (
          <button
            key={i}
            onClick={() => goTo(i)}
            className={`h-2 rounded-full transition-all duration-300 ${
              i === current ? "w-8 bg-white" : "w-2 bg-white/40 hover:bg-white/60"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

function ProductShowcase() {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("in_stock", true)
        .order("created_at", { ascending: false })
        .limit(8);
      if (data) setProducts(data);
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="flex gap-5 overflow-x-auto pb-4 -mx-4 px-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="flex-shrink-0 w-56">
            <div className="aspect-square rounded-xl bg-secondary animate-pulse mb-3" />
            <div className="h-4 bg-secondary animate-pulse rounded mb-2 w-3/4" />
            <div className="h-4 bg-secondary animate-pulse rounded w-1/2" />
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="flex gap-5 overflow-x-auto pb-4 snap-x snap-mandatory scrollbar-hide -mx-4 px-4">
      {products.map((p, i) => (
        <div
          key={p.id}
          className="flex-shrink-0 w-56 snap-start group animate-fade-up"
          style={{ animationDelay: `${i * 0.08}s` }}
        >
          <div className="relative aspect-square rounded-xl overflow-hidden mb-3 bg-secondary">
            <img src={p.image_url} alt={p.name} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" loading="lazy" />
            <div className="absolute top-2 left-2 px-2 py-0.5 rounded-full bg-white/90 text-[11px] font-medium text-foreground backdrop-blur-sm">
              {p.category}
            </div>
          </div>
          <h4 className="font-medium text-sm truncate">{p.name}</h4>
          <p className="font-display font-bold text-primary text-sm">{p.price.toLocaleString()} F CFA</p>
        </div>
      ))}
    </div>
  );
}

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <Link to="/" className="text-2xl font-display font-bold">
            Sunu <span className="text-gradient-gold">Derma</span>
          </Link>
          <div className="flex items-center gap-3">
            <Link to="/auth">
              <Button variant="ghost" size="sm">Connexion</Button>
            </Link>
            <Link to="/auth">
              <Button size="sm" className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold hover:opacity-90">
                Commencer
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative pt-24 pb-16 overflow-hidden">
        <div
          className="absolute inset-0 bg-cover bg-center opacity-15"
          style={{ backgroundImage: `url(${heroBg})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-background via-background/95 to-background" />

        <div className="container relative z-10">
          <div className="text-center mb-12">
            <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-secondary border border-border mb-6 animate-fade-up">
              <Star className="h-4 w-4 text-accent" />
              <span className="text-sm font-medium text-secondary-foreground">Plateforme #1 de dermatologie en Afrique</span>
            </div>

            <h1 className="text-4xl md:text-6xl lg:text-7xl font-display font-bold mb-6 animate-fade-up" style={{ animationDelay: "0.1s" }}>
              Prenez soin de votre
              <br />
              <span className="text-gradient-teal">peau</span> avec l'<span className="text-gradient-gold">IA</span>
            </h1>

            <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
              Analyse intelligente, consultations en temps réel avec des dermatologues,
              et routines personnalisées. Tout dans une seule application.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-12 animate-fade-up" style={{ animationDelay: "0.3s" }}>
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold hover:opacity-90 px-8 text-base">
                  Démarrer gratuitement <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Link to="/auth">
                <Button variant="outline" size="lg" className="px-8 text-base">
                  Je suis médecin
                </Button>
              </Link>
            </div>
          </div>

          {/* Hero Carousel */}
          <div className="animate-fade-up" style={{ animationDelay: "0.4s" }}>
            <HeroCarousel />
          </div>
        </div>
      </section>

      {/* Stats bar */}
      <section className="py-8 bg-gradient-hero">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
            {stats.map((s, i) => (
              <div key={s.label} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
                <div className="w-10 h-10 rounded-xl bg-white/10 flex items-center justify-center mx-auto mb-2">
                  <s.icon className="h-5 w-5 text-white/80" />
                </div>
                <p className="text-2xl md:text-3xl font-display font-bold text-white">{s.value}</p>
                <p className="text-xs text-white/60">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Features */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Tout pour votre <span className="text-gradient-gold">santé cutanée</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Des outils de pointe pour les patients et les professionnels de santé.
          </p>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <div
                key={f.title}
                className="group p-6 rounded-xl bg-card border border-border shadow-card hover:shadow-lg hover:-translate-y-2 transition-all duration-300 animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="w-14 h-14 rounded-xl bg-secondary flex items-center justify-center mb-5 group-hover:bg-primary/10 group-hover:scale-110 transition-all duration-300">
                  <f.icon className="h-7 w-7 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Products showcase */}
      <section className="py-20">
        <div className="container">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl md:text-4xl font-display font-bold">
                Nos <span className="text-gradient-teal">produits</span> skincare
              </h2>
              <p className="text-muted-foreground mt-2">Les meilleurs soins sélectionnés par nos dermatologues.</p>
            </div>
            <Link to="/auth">
              <Button variant="outline" className="hidden md:flex">
                Voir tout <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
          <ProductShowcase />
          <div className="mt-6 text-center md:hidden">
            <Link to="/auth">
              <Button variant="outline">Voir toute la boutique <ArrowRight className="ml-2 h-4 w-4" /></Button>
            </Link>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-20 bg-muted/30">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-14">
            Comment ça <span className="text-gradient-gold">marche</span> ?
          </h2>
          <div className="grid md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {[
              { step: "1", title: "Créez votre compte", desc: "Inscrivez-vous gratuitement et renseignez votre type de peau.", icon: Zap },
              { step: "2", title: "Analysez votre peau", desc: "Uploadez une photo et notre IA vous donne un diagnostic détaillé.", icon: Camera },
              { step: "3", title: "Consultez un dermatologue", desc: "Prenez rendez-vous et échangez en direct avec un spécialiste.", icon: Stethoscope },
            ].map((s, i) => (
              <div key={s.step} className="text-center animate-fade-up" style={{ animationDelay: `${i * 0.15}s` }}>
                <div className="relative w-20 h-20 rounded-2xl bg-gradient-hero flex items-center justify-center mx-auto mb-5">
                  <s.icon className="h-8 w-8 text-white" />
                  <span className="absolute -top-2 -right-2 w-7 h-7 rounded-full bg-gradient-gold text-accent-foreground text-xs font-bold flex items-center justify-center shadow-gold">
                    {s.step}
                  </span>
                </div>
                <h3 className="text-lg font-display font-semibold mb-2">{s.title}</h3>
                <p className="text-sm text-muted-foreground">{s.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section className="py-20">
        <div className="container">
          <h2 className="text-3xl md:text-4xl font-display font-bold text-center mb-4">
            Ce que disent nos <span className="text-gradient-teal">utilisateurs</span>
          </h2>
          <p className="text-muted-foreground text-center max-w-xl mx-auto mb-14">
            Rejoignez une communauté de patients et médecins satisfaits.
          </p>
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((t, i) => (
              <div
                key={t.name}
                className="p-6 rounded-xl bg-card border border-border shadow-card animate-fade-up"
                style={{ animationDelay: `${i * 0.1}s` }}
              >
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center font-display font-bold text-primary text-lg">
                    {t.avatar}
                  </div>
                  <div>
                    <p className="font-semibold text-sm">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
                <p className="text-sm text-muted-foreground leading-relaxed italic">"{t.text}"</p>
                <div className="flex gap-1 mt-3">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="h-3.5 w-3.5 fill-gold text-gold" />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-20">
        <div className="container">
          <div className="bg-gradient-hero rounded-2xl p-12 md:p-16 text-center relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 rounded-full bg-accent/10 blur-3xl animate-float" />
            <div className="absolute bottom-0 left-0 w-48 h-48 rounded-full bg-primary/10 blur-3xl animate-float" style={{ animationDelay: "3s" }} />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-primary-foreground mb-4 relative z-10">
              Prêt à transformer votre routine ?
            </h2>
            <p className="text-primary-foreground/70 max-w-lg mx-auto mb-6 relative z-10">
              Rejoignez des milliers de patients et dermatologues qui utilisent Sunu Derma chaque jour.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 relative z-10">
              <Link to="/auth">
                <Button size="lg" className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold hover:opacity-90 px-8">
                  Créer mon compte <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
            </div>
            <div className="flex items-center justify-center gap-6 mt-8 relative z-10">
              {["Gratuit pour commencer", "Pas de carte requise", "Annulez à tout moment"].map(t => (
                <div key={t} className="flex items-center gap-1.5 text-primary-foreground/70 text-xs">
                  <CheckCircle className="h-3.5 w-3.5" />
                  <span>{t}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 border-t border-border">
        <div className="container">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div>
              <p className="text-xl font-display font-bold mb-1">
                Sunu <span className="text-gradient-gold">Derma</span>
              </p>
              <p className="text-xs text-muted-foreground">Votre santé cutanée, réinventée.</p>
            </div>
            <div className="flex gap-8 text-sm text-muted-foreground">
              <a href="#" className="hover:text-primary transition-colors">Confidentialité</a>
              <a href="#" className="hover:text-primary transition-colors">CGU</a>
              <a href="#" className="hover:text-primary transition-colors">Contact</a>
            </div>
          </div>
          <p className="text-xs text-muted-foreground text-center mt-6">
            © 2026 Sunu Derma. Tous droits réservés.
          </p>
        </div>
      </footer>
    </div>
  );
}
