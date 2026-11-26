import { usePageMeta } from "@/lib/seo";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Sparkles, ShoppingBag, MessageCircle, Pill, LogOut, User,
  Camera, ChevronRight, Activity, Droplets, Sun, Star,
  CloudSun, ShieldAlert, TrendingUp, Upload, Send, Bot,
  ArrowLeft, Clock, Plus, Minus, CreditCard, Heart, Thermometer,
  Wind, Eye, Calendar, X, ChevronLeft, Package, Stethoscope,
  Image as ImageIcon, Loader2, Check, Bell, History, BellRing
} from "lucide-react";
import { useNavigate } from "react-router-dom";

type Tab = "home" | "ai-analysis" | "ai-chat" | "consultation" | "shop" | "profile" | "history" | "notifications" | "subscription";

// ======================= WEATHER WIDGET =======================
function WeatherWidget() {
  const [uv, setUv] = useState(7);
  const [temp, setTemp] = useState(32);
  const [humidity, setHumidity] = useState(65);

  useEffect(() => {
    // Simulated weather for Dakar
    setTemp(Math.floor(28 + Math.random() * 8));
    setUv(Math.floor(5 + Math.random() * 6));
    setHumidity(Math.floor(55 + Math.random() * 25));
  }, []);

  const uvLevel = uv >= 8 ? "Très élevé" : uv >= 6 ? "Élevé" : uv >= 3 ? "Modéré" : "Faible";
  const uvColor = uv >= 8 ? "text-destructive" : uv >= 6 ? "text-accent" : "text-primary";

  return (
    <Card className="shadow-card overflow-hidden">
      <div className="bg-gradient-hero p-5 text-primary-foreground">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <CloudSun className="h-5 w-5" />
            <span className="text-sm font-medium opacity-80">Dakar, Sénégal</span>
          </div>
          <span className="text-3xl font-display font-bold">{temp}°C</span>
        </div>
        <div className="grid grid-cols-3 gap-3 text-center">
          <div>
            <Sun className={`h-5 w-5 mx-auto mb-1 ${uv >= 6 ? "text-accent" : ""}`} />
            <p className="text-xs opacity-70">UV</p>
            <p className="font-bold">{uv}</p>
            <p className="text-[10px] opacity-60">{uvLevel}</p>
          </div>
          <div>
            <Droplets className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs opacity-70">Humidité</p>
            <p className="font-bold">{humidity}%</p>
          </div>
          <div>
            <Wind className="h-5 w-5 mx-auto mb-1" />
            <p className="text-xs opacity-70">Vent</p>
            <p className="font-bold">15km/h</p>
          </div>
        </div>
      </div>
      {uv >= 6 && (
        <div className="px-4 py-3 bg-accent/10 flex items-center gap-2 text-sm">
          <ShieldAlert className="h-4 w-4 text-accent flex-shrink-0" />
          <span className="text-accent-foreground">
            UV élevé ! Appliquez un SPF 50+ et réappliquez toutes les 2h.
          </span>
        </div>
      )}
    </Card>
  );
}

// ======================= SKIN SCORE CHART =======================
function SkinScoreChart({ analyses }: { analyses: any[] }) {
  const data = analyses.slice(0, 7).reverse();

  if (data.length === 0) {
    return (
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="font-display flex items-center gap-2 text-lg">
            <TrendingUp className="h-5 w-5 text-primary" />
            Évolution Peau
          </CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground text-center py-8 text-sm">
            Faites votre première analyse IA pour voir votre évolution.
          </p>
        </CardContent>
      </Card>
    );
  }

  const maxScore = 100;
  return (
    <Card className="shadow-card">
      <CardHeader className="pb-2">
        <CardTitle className="font-display flex items-center gap-2 text-lg">
          <TrendingUp className="h-5 w-5 text-primary" />
          Évolution Peau
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="flex items-end gap-2 h-32">
          {data.map((a, i) => (
            <div key={a.id} className="flex-1 flex flex-col items-center gap-1">
              <span className="text-[10px] font-medium text-muted-foreground">{a.score || 0}</span>
              <div
                className="w-full rounded-t-md bg-primary/20 relative overflow-hidden"
                style={{ height: `${((a.score || 0) / maxScore) * 100}%` }}
              >
                <div
                  className="absolute bottom-0 w-full bg-primary rounded-t-md transition-all"
                  style={{ height: "100%" }}
                />
              </div>
              <span className="text-[10px] text-muted-foreground">
                {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
              </span>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

// ======================= AI ANALYSIS PAGE =======================
function AIAnalysisPage({ onBack, userId }: { onBack: () => void; userId: string }) {
  const [image, setImage] = useState<string | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<any>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  const [imageFile, setImageFile] = useState<File | null>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setImageFile(file);
    const reader = new FileReader();
    reader.onload = (ev) => setImage(ev.target?.result as string);
    reader.readAsDataURL(file);
  };

  const uploadImageToStorage = async (file: File, userId: string): Promise<string | null> => {
    const ext = file.name.split(".").pop() || "jpg";
    const path = `${userId}/${Date.now()}.${ext}`;
    const { error } = await supabase.storage.from("skin-analyses").upload(path, file, { upsert: false });
    if (error) { console.error("Upload error:", error); return null; }
    const { data: { publicUrl } } = supabase.storage.from("skin-analyses").getPublicUrl(path);
    return publicUrl;
  };

  const analyze = async () => {
    if (!image) return;
    setAnalyzing(true);
    setResult(null);
    try {
      const { data, error } = await supabase.functions.invoke("analyze-skin", {
        body: { imageBase64: image },
      });
      if (error) throw error;
      setResult(data);

      // Upload photo to storage
      let storedUrl: string | null = null;
      if (imageFile) {
        storedUrl = await uploadImageToStorage(imageFile, userId);
      }

      // Save to DB with real image URL
      await supabase.from("skin_analyses").insert({
        user_id: userId,
        score: data.score || null,
        hydration: data.hydration || null,
        elasticity: data.elasticity || null,
        clarity: data.clarity || null,
        notes: JSON.stringify(data.conditions || []),
        image_url: storedUrl,
      });
    } catch (err: any) {
      console.error(err);
      setResult({ error: err.message || "Erreur d'analyse" });
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-display font-bold">Analyse IA de Peau</h2>
      </div>

      {!result ? (
        <div className="space-y-4">
          <Card className="shadow-card border-dashed border-2 border-primary/30">
            <CardContent className="p-8 text-center">
              {image ? (
                <div className="space-y-4">
                  <img src={image} alt="Photo peau" className="max-h-64 mx-auto rounded-xl object-cover" />
                  <div className="flex gap-3 justify-center">
                    <Button variant="outline" onClick={() => { setImage(null); }}>
                      Changer la photo
                    </Button>
                    <Button onClick={analyze} disabled={analyzing} className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold">
                      {analyzing ? <><Loader2 className="h-4 w-4 mr-2 animate-spin" /> Analyse en cours...</> : <><Sparkles className="h-4 w-4 mr-2" /> Analyser</>}
                    </Button>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="w-20 h-20 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
                    <Camera className="h-10 w-10 text-primary" />
                  </div>
                  <div>
                    <h3 className="font-display font-semibold text-lg">Prenez une photo</h3>
                    <p className="text-muted-foreground text-sm mt-1">
                      Envoyez une photo claire de la zone à analyser. L'IA donne une estimation, pas un diagnostic médical : en cas de doute, consultez un dermatologue.
                    </p>
                  </div>
                  <input type="file" accept="image/*" capture="environment" ref={fileRef} onChange={handleFileChange} className="hidden" />
                  <div className="flex gap-3 justify-center">
                    <Button onClick={() => fileRef.current?.click()} className="bg-gradient-gold text-accent-foreground font-semibold">
                      <Upload className="h-4 w-4 mr-2" /> Uploader une photo
                    </Button>
                    <Button variant="outline" onClick={() => {
                      const input = fileRef.current;
                      if (input) { input.setAttribute("capture", "user"); input.click(); }
                    }}>
                      <Camera className="h-4 w-4 mr-2" /> Prendre un selfie
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          <Card className="shadow-card bg-secondary/50">
            <CardContent className="p-4">
              <h4 className="font-medium text-sm mb-2">💡 Conseils pour une bonne photo :</h4>
              <ul className="text-xs text-muted-foreground space-y-1">
                <li>• Bonne lumière naturelle, sans flash</li>
                <li>• Photo nette et rapprochée de la zone</li>
                <li>• Visage propre sans maquillage</li>
                <li>• Fond neutre si possible</li>
              </ul>
            </CardContent>
          </Card>
        </div>
      ) : result.error ? (
        <Card className="shadow-card border-destructive">
          <CardContent className="p-6 text-center">
            <p className="text-destructive">{result.error}</p>
            <Button className="mt-4" onClick={() => setResult(null)}>Réessayer</Button>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4 animate-fade-up">
          {/* Score global */}
          <Card className="shadow-card">
            <CardContent className="p-6 text-center">
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-3">
                <span className="text-3xl font-display font-bold text-primary">{result.score || "--"}</span>
              </div>
              <p className="font-display font-semibold text-lg">Score Santé Cutanée</p>
              <p className="text-sm text-muted-foreground">
                Sévérité: <span className="font-medium">{result.severity || "N/A"}</span>
                {result.fitzpatrick && <> • Fitzpatrick: {result.fitzpatrick}</>}
              </p>
            </CardContent>
          </Card>

          {/* Metrics */}
          <div className="grid grid-cols-3 gap-3">
            {[
              { label: "Hydratation", value: result.hydration, icon: Droplets, color: "text-primary" },
              { label: "Élasticité", value: result.elasticity, icon: Activity, color: "text-accent" },
              { label: "Clarté", value: result.clarity, icon: Sun, color: "text-gold" },
            ].map(m => (
              <Card key={m.label} className="shadow-card">
                <CardContent className="p-4 text-center">
                  <m.icon className={`h-5 w-5 mx-auto mb-1 ${m.color}`} />
                  <p className="text-2xl font-display font-bold">{m.value || "--"}</p>
                  <p className="text-[11px] text-muted-foreground">{m.label}</p>
                </CardContent>
              </Card>
            ))}
          </div>

          {/* Conditions */}
          {result.conditions && result.conditions.length > 0 && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display">Conditions détectées</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {result.conditions.map((c: string, i: number) => (
                    <span key={i} className="px-3 py-1.5 rounded-full bg-accent/10 text-accent text-sm font-medium">{c}</span>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recommendations */}
          {result.recommendations && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display">Recommandations</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {result.recommendations.map((r: string, i: number) => (
                  <div key={i} className="flex items-start gap-2 text-sm">
                    <Check className="h-4 w-4 text-primary mt-0.5 flex-shrink-0" />
                    <span>{r}</span>
                  </div>
                ))}
              </CardContent>
            </Card>
          )}

          {/* Routine */}
          {(result.routine_matin || result.routine_soir) && (
            <div className="grid md:grid-cols-2 gap-4">
              {result.routine_matin && (
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Sun className="h-4 w-4 text-accent" /> Routine Matin
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.routine_matin.map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-accent/10 text-accent flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
              {result.routine_soir && (
                <Card className="shadow-card">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-lg font-display flex items-center gap-2">
                      <Star className="h-4 w-4 text-primary" /> Routine Soir
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-2">
                    {result.routine_soir.map((step: string, i: number) => (
                      <div key={i} className="flex items-center gap-2 text-sm">
                        <span className="w-6 h-6 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-bold">{i + 1}</span>
                        <span>{step}</span>
                      </div>
                    ))}
                  </CardContent>
                </Card>
              )}
            </div>
          )}

          <div className="flex gap-3">
            <Button className="flex-1" onClick={() => { setResult(null); setImage(null); }}>
              Nouvelle analyse
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

// ======================= AI CHAT PAGE =======================
function AIChatPage({ onBack }: { onBack: () => void }) {
  const [messages, setMessages] = useState<{ role: "user" | "assistant"; content: string }[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const chatEndRef = useRef<HTMLDivElement>(null);

  const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/derma-chat`;

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const userMsg = { role: "user" as const, content: input.trim() };
    const allMessages = [...messages, userMsg];
    setMessages(allMessages);
    setInput("");
    setLoading(true);

    let assistantSoFar = "";

    try {
      const resp = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({ messages: allMessages }),
      });

      if (!resp.ok || !resp.body) throw new Error("Stream failed");

      const reader = resp.body.getReader();
      const decoder = new TextDecoder();
      let textBuffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        textBuffer += decoder.decode(value, { stream: true });

        let newlineIndex: number;
        while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
          let line = textBuffer.slice(0, newlineIndex);
          textBuffer = textBuffer.slice(newlineIndex + 1);
          if (line.endsWith("\r")) line = line.slice(0, -1);
          if (line.startsWith(":") || line.trim() === "") continue;
          if (!line.startsWith("data: ")) continue;
          const jsonStr = line.slice(6).trim();
          if (jsonStr === "[DONE]") break;
          try {
            const parsed = JSON.parse(jsonStr);
            const content = parsed.choices?.[0]?.delta?.content;
            if (content) {
              assistantSoFar += content;
              setMessages(prev => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant") {
                  return prev.map((m, i) => i === prev.length - 1 ? { ...m, content: assistantSoFar } : m);
                }
                return [...prev, { role: "assistant", content: assistantSoFar }];
              });
            }
          } catch { 
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (e) {
      console.error(e);
      setMessages(prev => [...prev, { role: "assistant", content: "Désolé, une erreur est survenue. Réessayez." }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[calc(100vh-5rem)]">
      <div className="flex items-center gap-3 pb-4">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <div className="flex items-center gap-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Bot className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h2 className="font-display font-bold">Assistant Derma IA</h2>
            <p className="text-xs text-muted-foreground">En ligne • Répond instantanément</p>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto space-y-4 pb-4">
        {messages.length === 0 && (
          <div className="text-center py-12 space-y-4">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto">
              <Sparkles className="h-8 w-8 text-primary" />
            </div>
            <p className="text-muted-foreground text-sm max-w-xs mx-auto">
              Posez vos questions sur votre peau, votre routine, ou des conditions dermatologiques.
            </p>
            <div className="flex flex-wrap gap-2 justify-center">
              {["J'ai de l'acné, que faire ?", "Routine pour peau grasse", "Comment traiter les taches ?"].map(q => (
                <button key={q} onClick={() => { setInput(q); }} className="px-3 py-2 rounded-full bg-secondary text-sm hover:bg-secondary/80 transition-colors">
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
            <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm whitespace-pre-wrap ${
              m.role === "user"
                ? "bg-primary text-primary-foreground rounded-br-md"
                : "bg-secondary text-secondary-foreground rounded-bl-md"
            }`}>
              {m.content}
            </div>
          </div>
        ))}
        {loading && messages[messages.length - 1]?.role !== "assistant" && (
          <div className="flex justify-start">
            <div className="bg-secondary rounded-2xl rounded-bl-md px-4 py-3">
              <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
            </div>
          </div>
        )}
        <div ref={chatEndRef} />
      </div>

      <div className="flex gap-2 pt-2 border-t border-border">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={e => e.key === "Enter" && send()}
          placeholder="Posez votre question..."
          className="flex-1"
        />
        <Button onClick={send} disabled={loading || !input.trim()} size="icon" className="bg-gradient-gold text-accent-foreground">
          <Send className="h-4 w-4" />
        </Button>
      </div>
    </div>
  );
}

// ======================= CONSULTATION PAGE =======================
function ConsultationPage({ onBack, userId }: { onBack: () => void; userId: string }) {
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [doctors, setDoctors] = useState<any[]>([]);
  const [doctorProfiles, setDoctorProfiles] = useState<Record<string, any>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);
  const [showBooking, setShowBooking] = useState<string | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");
  const [bookingLoading, setBookingLoading] = useState(false);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<"doctors" | "appointments" | "consultations">("doctors");

  useEffect(() => {
    loadConsultations();
    loadDoctors();
    loadAppointments();
  }, [userId]);

  const loadConsultations = async () => {
    const { data } = await supabase.from("consultations").select("*").eq("patient_id", userId).order("created_at", { ascending: false });
    setConsultations(data || []);
  };

  const loadDoctors = async () => {
    const { data: roles } = await supabase.from("user_roles").select("user_id").eq("role", "doctor");
    if (!roles || roles.length === 0) return;
    const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", roles.map(r => r.user_id));
    setDoctors(profiles || []);
    const map: Record<string, any> = {};
    (profiles || []).forEach(p => { map[p.user_id] = p; });
    setDoctorProfiles(map);
  };

  const loadAppointments = async () => {
    const { data } = await supabase.from("appointments").select("*").eq("patient_id", userId).order("appointment_date", { ascending: true });
    setAppointments(data || []);
  };

  const startConsultation = async (doctorId: string) => {
    const { data, error } = await supabase.from("consultations").insert({
      patient_id: userId,
      doctor_id: doctorId,
      status: "pending",
    }).select().single();
    if (data) {
      setSelectedConsult(data);
      loadConsultations();
    }
  };

  const bookAppointment = async () => {
    if (!showBooking || !bookingDate || !bookingTime) return;
    setBookingLoading(true);
    try {
      const appointmentDate = new Date(`${bookingDate}T${bookingTime}`);
      await supabase.from("appointments").insert({
        patient_id: userId,
        doctor_id: showBooking,
        appointment_date: appointmentDate.toISOString(),
        notes: bookingNotes || null,
        status: "pending",
      });
      setShowBooking(null);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      loadAppointments();
      setActiveSubTab("appointments");
    } catch (err) {
      console.error(err);
    } finally {
      setBookingLoading(false);
    }
  };

  useEffect(() => {
    if (!selectedConsult) return;
    const loadMessages = async () => {
      const { data } = await supabase.from("messages").select("*").eq("consultation_id", selectedConsult.id).order("created_at", { ascending: true });
      setMessages(data || []);
    };
    loadMessages();

    const channel = supabase
      .channel(`messages-${selectedConsult.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `consultation_id=eq.${selectedConsult.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new]); }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConsult]);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConsult) return;
    await supabase.from("messages").insert({
      consultation_id: selectedConsult.id,
      sender_id: userId,
      content: input.trim(),
    });
    setInput("");
  };

  // Booking modal
  if (showBooking) {
    const doctor = doctors.find(d => d.user_id === showBooking);
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowBooking(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Prendre RDV</h2>
        </div>

        <Card className="shadow-card">
          <CardContent className="p-6">
            <div className="flex items-center gap-4 mb-6">
              <div className="w-14 h-14 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                {doctor?.avatar_url ? (
                  <img src={doctor.avatar_url} alt={doctor.full_name} className="w-full h-full object-cover" />
                ) : (
                  <Stethoscope className="h-7 w-7 text-accent" />
                )}
              </div>
              <div>
                <h3 className="font-display font-semibold text-lg">{doctor?.full_name || "Dr."}</h3>
                <p className="text-sm text-muted-foreground">Dermatologue</p>
                {doctor?.consultation_fee > 0 && (
                  <p className="text-sm font-bold text-primary">{doctor.consultation_fee.toLocaleString()} FCFA</p>
                )}
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Date du rendez-vous</label>
                <Input type="date" value={bookingDate} onChange={e => setBookingDate(e.target.value)} min={new Date().toISOString().split("T")[0]} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Heure</label>
                <Input type="time" value={bookingTime} onChange={e => setBookingTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Motif (optionnel)</label>
                <Textarea value={bookingNotes} onChange={e => setBookingNotes(e.target.value)} placeholder="Décrivez brièvement votre problème..." rows={3} />
              </div>
              <Button
                onClick={bookAppointment}
                disabled={bookingLoading || !bookingDate || !bookingTime}
                className="w-full bg-gradient-gold text-accent-foreground font-semibold shadow-gold"
              >
                {bookingLoading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Calendar className="h-4 w-4 mr-2" />}
                Confirmer le rendez-vous
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (selectedConsult) {
    const doctorName = doctorProfiles[selectedConsult.doctor_id]?.full_name || "Dermatologue";
    return (
      <div className="flex flex-col h-[calc(100vh-5rem)]">
        <div className="flex items-center gap-3 pb-4">
          <Button variant="ghost" size="icon" onClick={() => setSelectedConsult(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="flex items-center gap-2">
            <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
              {doctorProfiles[selectedConsult.doctor_id]?.avatar_url ? (
                <img src={doctorProfiles[selectedConsult.doctor_id].avatar_url} alt={doctorName} className="w-full h-full object-cover" />
              ) : (
                <Stethoscope className="h-5 w-5 text-accent" />
              )}
            </div>
            <div>
              <h3 className="font-display font-semibold">{doctorName}</h3>
              <p className="text-xs text-muted-foreground capitalize">{selectedConsult.status}</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 pb-4">
          {messages.length === 0 && (
            <p className="text-center text-muted-foreground text-sm py-12">
              Commencez la conversation avec votre dermatologue.
            </p>
          )}
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.sender_id === userId ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                m.sender_id === userId
                  ? "bg-primary text-primary-foreground rounded-br-md"
                  : "bg-secondary rounded-bl-md"
              }`}>
                {m.content}
                <p className="text-[10px] opacity-60 mt-1">
                  {new Date(m.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                </p>
              </div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>

        <div className="flex gap-2 pt-2 border-t border-border">
          <Input value={input} onChange={e => setInput(e.target.value)} onKeyDown={e => e.key === "Enter" && sendMessage()} placeholder="Votre message..." className="flex-1" />
          <Button onClick={sendMessage} size="icon" className="bg-gradient-gold text-accent-foreground">
            <Send className="h-4 w-4" />
          </Button>
        </div>
      </div>
    );
  }

  const statusLabel = (s: string) => {
    switch (s) {
      case "pending": return { text: "En attente", cls: "bg-accent/10 text-accent" };
      case "confirmed": return { text: "Confirmé", cls: "bg-primary/10 text-primary" };
      case "cancelled": return { text: "Annulé", cls: "bg-destructive/10 text-destructive" };
      case "completed": return { text: "Terminé", cls: "bg-muted text-muted-foreground" };
      default: return { text: s, cls: "bg-muted text-muted-foreground" };
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-display font-bold">Télémédecine</h2>
      </div>

      {/* Sub-tabs */}
      <div className="flex gap-2">
        {[
          { key: "doctors" as const, label: "Médecins", icon: Stethoscope },
          { key: "appointments" as const, label: "Rendez-vous", icon: Calendar },
          { key: "consultations" as const, label: "Messages", icon: MessageCircle },
        ].map(t => (
          <button
            key={t.key}
            onClick={() => setActiveSubTab(t.key)}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeSubTab === t.key ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Doctors list */}
      {activeSubTab === "doctors" && (
        <div>
          <h3 className="font-display font-semibold mb-3">Dermatologues disponibles</h3>
          {doctors.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center text-muted-foreground">
                Aucun dermatologue disponible pour le moment.
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {doctors.map(d => (
                <Card key={d.id} className="shadow-card hover:shadow-lg transition-all">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                      {d.avatar_url ? (
                        <img src={d.avatar_url} alt={d.full_name} className="w-full h-full object-cover" />
                      ) : (
                        <Stethoscope className="h-6 w-6 text-accent" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium">{d.full_name || "Dr."}</p>
                      <p className="text-xs text-muted-foreground">Dermatologue</p>
                      {d.consultation_fee > 0 && (
                        <p className="text-xs font-bold text-primary mt-0.5">{d.consultation_fee.toLocaleString()} FCFA / consultation</p>
                      )}
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <Button size="sm" variant="outline" onClick={() => setShowBooking(d.user_id)} className="text-xs">
                        <Calendar className="h-3 w-3 mr-1" /> RDV
                      </Button>
                      <Button size="sm" onClick={() => startConsultation(d.user_id)} className="text-xs bg-gradient-gold text-accent-foreground">
                        <MessageCircle className="h-3 w-3 mr-1" /> Chat
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Appointments */}
      {activeSubTab === "appointments" && (
        <div>
          <h3 className="font-display font-semibold mb-3">Mes Rendez-vous</h3>
          {appointments.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <Calendar className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucun rendez-vous programmé.</p>
                <Button variant="outline" className="mt-4" onClick={() => setActiveSubTab("doctors")}>
                  Prendre un rendez-vous
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {appointments.map(a => {
                const st = statusLabel(a.status);
                const doctorName = doctorProfiles[a.doctor_id]?.full_name || "Dermatologue";
                return (
                  <Card key={a.id} className="shadow-card">
                    <CardContent className="p-4">
                      <div className="flex items-start gap-4">
                        <div className="w-10 h-10 rounded-lg bg-primary/10 flex items-center justify-center flex-shrink-0">
                          <Calendar className="h-5 w-5 text-primary" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-1">
                            <p className="font-medium text-sm">{doctorName}</p>
                            <span className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${st.cls}`}>{st.text}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            {new Date(a.appointment_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                            {" à "}
                            {new Date(a.appointment_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Consultations (messages) */}
      {activeSubTab === "consultations" && (
        <div>
          <h3 className="font-display font-semibold mb-3">Mes consultations</h3>
          {consultations.length === 0 ? (
            <Card className="shadow-card">
              <CardContent className="p-8 text-center">
                <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
                <p className="text-muted-foreground">Aucune consultation en cours.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="space-y-3">
              {consultations.map(c => {
                const doctorName = doctorProfiles[c.doctor_id]?.full_name || "Dermatologue";
                return (
                  <Card key={c.id} className="shadow-card hover:shadow-lg transition-all cursor-pointer" onClick={() => setSelectedConsult(c)}>
                    <CardContent className="p-4 flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full bg-accent/10 flex items-center justify-center overflow-hidden">
                        {doctorProfiles[c.doctor_id]?.avatar_url ? (
                          <img src={doctorProfiles[c.doctor_id].avatar_url} alt={doctorName} className="w-full h-full object-cover" />
                        ) : (
                          <MessageCircle className="h-5 w-5 text-accent" />
                        )}
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-sm">{doctorName}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(c.created_at).toLocaleDateString("fr-FR")} • <span className="capitalize">{c.status}</span>
                        </p>
                      </div>
                      <ChevronRight className="h-4 w-4 text-muted-foreground" />
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ======================= SHOP PAGE =======================
function ShopPage({ onBack, userId }: { onBack: () => void; userId: string }) {
  const [products, setProducts] = useState<any[]>([]);
  const [cart, setCart] = useState<{ product: any; qty: number }[]>([]);
  const [showCart, setShowCart] = useState(false);
  const [filter, setFilter] = useState("Tout");
  const [ordering, setOrdering] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  useEffect(() => {
    supabase.from("products").select("*").order("category").then(({ data }) => setProducts(data || []));
  }, []);

  const categories = ["Tout", ...new Set(products.map(p => p.category))];
  const filtered = filter === "Tout" ? products : products.filter(p => p.category === filter);

  const addToCart = (product: any) => {
    setCart(prev => {
      const existing = prev.find(c => c.product.id === product.id);
      if (existing) return prev.map(c => c.product.id === product.id ? { ...c, qty: c.qty + 1 } : c);
      return [...prev, { product, qty: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(prev => prev.map(c => c.product.id === productId ? { ...c, qty: c.qty - 1 } : c).filter(c => c.qty > 0));
  };

  const total = cart.reduce((sum, c) => sum + c.product.price * c.qty, 0);

  const placeOrder = async (method: string) => {
    setOrdering(true);
    try {
      await supabase.from("orders").insert({
        user_id: userId,
        product_ids: cart.map(c => c.product.id),
        total,
        payment_method: method,
        status: "pending",
      });
      setOrderSuccess(true);
      setCart([]);
    } catch (e) {
      console.error(e);
    } finally {
      setOrdering(false);
    }
  };

  if (orderSuccess) {
    return (
      <div className="space-y-6 text-center py-16">
        <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
          <Check className="h-10 w-10 text-primary" />
        </div>
        <h2 className="text-2xl font-display font-bold">Commande confirmée !</h2>
        <p className="text-muted-foreground">Votre commande a été enregistrée avec succès.</p>
        <Button onClick={() => { setOrderSuccess(false); setShowCart(false); }}>
          Continuer mes achats
        </Button>
      </div>
    );
  }

  if (showCart) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowCart(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Mon Panier</h2>
        </div>

        {cart.length === 0 ? (
          <Card className="shadow-card">
            <CardContent className="p-12 text-center">
              <ShoppingBag className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
              <p className="text-muted-foreground">Votre panier est vide</p>
            </CardContent>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              {cart.map(c => (
                <Card key={c.product.id} className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <div className="w-16 h-16 rounded-lg bg-secondary flex items-center justify-center">
                      {c.product.image_url ? (
                        <img src={c.product.image_url} alt={c.product.name} className="w-full h-full object-cover rounded-lg" />
                      ) : (
                        <Package className="h-6 w-6 text-muted-foreground" />
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="font-medium text-sm">{c.product.name}</p>
                      <p className="text-sm text-primary font-bold">{c.product.price} FCFA</p>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => removeFromCart(c.product.id)}>
                        <Minus className="h-3 w-3" />
                      </Button>
                      <span className="font-bold w-6 text-center">{c.qty}</span>
                      <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => addToCart(c.product)}>
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <Card className="shadow-card">
              <CardContent className="p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-display font-semibold">Total</span>
                  <span className="text-xl font-display font-bold text-primary">{total.toLocaleString()} FCFA</span>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <Button onClick={() => placeOrder("wave")} disabled={ordering} className="bg-[#1DC3E1] hover:bg-[#1ab0cc] text-primary-foreground">
                    <CreditCard className="h-4 w-4 mr-2" /> Wave
                  </Button>
                  <Button onClick={() => placeOrder("orange_money")} disabled={ordering} className="bg-[#FF6600] hover:bg-[#e55c00] text-primary-foreground">
                    <CreditCard className="h-4 w-4 mr-2" /> Orange Money
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Boutique</h2>
        </div>
        <Button variant="outline" className="relative" onClick={() => setShowCart(true)}>
          <ShoppingBag className="h-4 w-4" />
          {cart.length > 0 && (
            <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-accent text-accent-foreground text-[10px] flex items-center justify-center font-bold">
              {cart.reduce((s, c) => s + c.qty, 0)}
            </span>
          )}
        </Button>
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2">
        {categories.map(c => (
          <button
            key={c}
            onClick={() => setFilter(c)}
            className={`px-4 py-2 rounded-full text-sm whitespace-nowrap transition-colors ${
              filter === c ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground hover:bg-secondary/80"
            }`}
          >
            {c}
          </button>
        ))}
      </div>

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {filtered.map(p => (
          <Card key={p.id} className={`shadow-card overflow-hidden group hover:shadow-lg transition-all ${!p.in_stock ? "opacity-60" : ""}`}>
            <div className="aspect-square bg-secondary flex items-center justify-center relative">
              {p.image_url ? (
                <img src={p.image_url} alt={p.name} className="w-full h-full object-cover" />
              ) : (
                <Package className="h-10 w-10 text-muted-foreground/30" />
              )}
              {!p.in_stock && (
                <div className="absolute inset-0 bg-background/70 flex items-center justify-center">
                  <span className="px-3 py-1 rounded-full bg-destructive text-destructive-foreground text-xs font-bold">Rupture</span>
                </div>
              )}
            </div>
            <CardContent className="p-3">
              <h3 className="font-medium text-sm truncate">{p.name}</h3>
              <p className="text-xs text-muted-foreground truncate mb-2">{p.category}</p>
              <div className="flex items-center justify-between">
                <span className="font-display font-bold text-primary">{p.price.toLocaleString()} F</span>
                {p.in_stock ? (
                  <Button size="sm" variant="outline" className="h-8" onClick={() => addToCart(p)}>
                    <Plus className="h-3 w-3" />
                  </Button>
                ) : (
                  <span className="text-[10px] text-destructive font-medium">Indisponible</span>
                )}
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {filtered.length === 0 && (
        <p className="text-center text-muted-foreground py-12">Aucun produit dans cette catégorie.</p>
      )}
    </div>
  );
}

// ======================= PROFILE PAGE =======================
function ProfilePage({ onBack, profile, userId, onProfileUpdate }: { onBack: () => void; profile: any; userId: string; onProfileUpdate: (p: any) => void }) {
  const { signOut } = useAuth();
  const [orders, setOrders] = useState<any[]>([]);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({
    full_name: profile?.full_name || "",
    skin_type: profile?.skin_type || "",
    phone: profile?.phone || "",
    address: profile?.address || "",
  });

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${userId}/avatar.${ext}`;
      const { error: uploadError } = await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      if (uploadError) throw uploadError;
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", userId);
      onProfileUpdate({ ...profile, avatar_url: avatarUrl });
    } catch (err) {
      console.error("Avatar upload error:", err);
    } finally {
      setUploadingAvatar(false);
    }
  };

  useEffect(() => {
    supabase.from("orders").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(10).then(({ data }) => setOrders(data || []));
  }, [userId]);

  useEffect(() => {
    if (profile) {
      setForm({
        full_name: profile.full_name || "",
        skin_type: profile.skin_type || "",
        phone: profile.phone || "",
        address: profile.address || "",
      });
    }
  }, [profile]);

  const saveProfile = async () => {
    setSaving(true);
    try {
      const { data } = await supabase.from("profiles").update({
        full_name: form.full_name,
        skin_type: form.skin_type,
        phone: form.phone,
        address: form.address,
      }).eq("user_id", userId).select().single();
      if (data) onProfileUpdate(data);
      setEditing(false);
    } finally {
      setSaving(false);
    }
  };

  const skinTypes = ["Normale", "Grasse", "Sèche", "Mixte", "Sensible"];

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-display font-bold">Mon Profil</h2>
      </div>

      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarUpload} className="hidden" />
            <div className="relative w-24 h-24 mx-auto mb-4 group cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {uploadingAvatar ? (
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                ) : profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-10 w-10 text-primary" />
                )}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold">{profile?.full_name || "Patient"}</h3>
            <p className="text-sm text-muted-foreground">{profile?.skin_type || "Type de peau non défini"}</p>
            <div className="flex justify-center gap-4 mt-3">
              <div className="text-center">
                <p className="text-lg font-bold text-primary">{profile?.is_premium ? "Premium" : "Gratuit"}</p>
                <p className="text-xs text-muted-foreground">Abonnement</p>
              </div>
            </div>
          </div>

          {editing ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom complet</label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Type de peau</label>
                <div className="flex flex-wrap gap-2">
                  {skinTypes.map(t => (
                    <button key={t} onClick={() => setForm(f => ({ ...f, skin_type: t }))}
                      className={`px-3 py-1.5 rounded-full text-sm transition-colors ${form.skin_type === t ? "bg-primary text-primary-foreground" : "bg-secondary text-secondary-foreground"}`}>
                      {t}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Téléphone</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+221 77 000 00 00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Adresse de livraison</label>
                <Textarea value={form.address} onChange={e => setForm(f => ({ ...f, address: e.target.value }))} placeholder="Quartier, Ville, Pays" rows={2} />
              </div>
              <div className="flex gap-3">
                <Button variant="outline" className="flex-1" onClick={() => setEditing(false)}>Annuler</Button>
                <Button className="flex-1 bg-gradient-gold text-accent-foreground font-semibold" onClick={saveProfile} disabled={saving}>
                  {saving ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Check className="h-4 w-4 mr-2" />}
                  Enregistrer
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-3 border-t border-border pt-4">
              {[
                { label: "Téléphone", value: profile?.phone || "Non renseigné" },
                { label: "Adresse", value: profile?.address || "Non renseignée" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>
                Modifier mon profil
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {orders.length > 0 && (
        <Card className="shadow-card">
          <CardHeader className="pb-2">
            <CardTitle className="text-lg font-display flex items-center gap-2">
              <Package className="h-5 w-5 text-accent" /> Mes Commandes
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {orders.map(o => (
              <div key={o.id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50">
                <div>
                  <p className="text-sm font-medium">{o.total.toLocaleString()} FCFA</p>
                  <p className="text-xs text-muted-foreground">{new Date(o.created_at).toLocaleDateString("fr-FR")} • {o.payment_method}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  o.status === "pending" ? "bg-accent/10 text-accent" : "bg-primary/10 text-primary"
                }`}>
                  {o.status === "pending" ? "En attente" : o.status}
                </span>
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
      </Button>
    </div>
  );
}

// ======================= PHOTO HISTORY PAGE =======================
function PhotoHistoryPage({ onBack, analyses }: { onBack: () => void; analyses: any[] }) {
  const [selectedPhoto, setSelectedPhoto] = useState<any>(null);
  const photosWithImages = analyses.filter(a => a.image_url && !a.image_url.startsWith("data:"));

  if (selectedPhoto) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setSelectedPhoto(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Détail Analyse</h2>
        </div>
        <Card className="shadow-card overflow-hidden">
          <img src={selectedPhoto.image_url} alt="Analyse peau" className="w-full aspect-square object-cover" />
        </Card>
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "Hydratation", value: selectedPhoto.hydration, icon: Droplets, color: "text-primary" },
            { label: "Élasticité", value: selectedPhoto.elasticity, icon: Activity, color: "text-accent-foreground" },
            { label: "Clarté", value: selectedPhoto.clarity, icon: Sun, color: "text-gold" },
          ].map(m => (
            <Card key={m.label} className="shadow-card">
              <CardContent className="p-3 text-center">
                <m.icon className={`h-4 w-4 mx-auto mb-1 ${m.color}`} />
                <p className="text-xl font-display font-bold">{m.value || "--"}</p>
                <p className="text-[10px] text-muted-foreground">{m.label}</p>
              </CardContent>
            </Card>
          ))}
        </div>
        <Card className="shadow-card">
          <CardContent className="p-4">
            <div className="flex items-center justify-between mb-2">
              <span className="font-display font-semibold">Score global</span>
              <span className="text-2xl font-display font-bold text-primary">{selectedPhoto.score || "--"}/100</span>
            </div>
            <p className="text-xs text-muted-foreground">
              {new Date(selectedPhoto.created_at).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long", year: "numeric" })}
            </p>
            {selectedPhoto.notes && (
              <div className="mt-3 flex flex-wrap gap-1.5">
                {JSON.parse(selectedPhoto.notes).map((c: string, i: number) => (
                  <span key={i} className="px-2 py-1 rounded-full bg-accent/10 text-accent-foreground text-xs">{c}</span>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}>
          <ArrowLeft className="h-5 w-5" />
        </Button>
        <h2 className="text-2xl font-display font-bold">Mon Historique Photos</h2>
      </div>

      {photosWithImages.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <ImageIcon className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune photo d'analyse sauvegardée.</p>
            <p className="text-xs text-muted-foreground mt-1">Faites une analyse IA pour commencer votre suivi visuel.</p>
          </CardContent>
        </Card>
      ) : (
        <>
          {/* Timeline comparison */}
          {photosWithImages.length >= 2 && (
            <Card className="shadow-card">
              <CardHeader className="pb-2">
                <CardTitle className="text-lg font-display flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-primary" /> Évolution
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Première analyse</p>
                    <img src={photosWithImages[photosWithImages.length - 1].image_url} alt="Avant" className="w-full aspect-square object-cover rounded-xl" />
                    <p className="text-sm font-bold mt-1">Score: {photosWithImages[photosWithImages.length - 1].score || "--"}</p>
                  </div>
                  <div className="text-center">
                    <p className="text-xs text-muted-foreground mb-2">Dernière analyse</p>
                    <img src={photosWithImages[0].image_url} alt="Après" className="w-full aspect-square object-cover rounded-xl" />
                    <p className="text-sm font-bold mt-1">Score: {photosWithImages[0].score || "--"}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Photo grid */}
          <div className="grid grid-cols-3 gap-2">
            {photosWithImages.map(a => (
              <div key={a.id} className="relative group cursor-pointer" onClick={() => setSelectedPhoto(a)}>
                <img src={a.image_url} alt="Analyse" className="w-full aspect-square object-cover rounded-xl" />
                <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent rounded-xl opacity-0 group-hover:opacity-100 transition-opacity flex items-end p-2">
                  <div>
                    <p className="text-white text-xs font-bold">Score: {a.score || "--"}</p>
                    <p className="text-white/70 text-[10px]">
                      {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                    </p>
                  </div>
                </div>
                {/* Always show date on mobile */}
                <div className="absolute bottom-1 left-1 px-1.5 py-0.5 rounded bg-black/50 text-white text-[9px] md:hidden">
                  {new Date(a.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "2-digit" })}
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

// ======================= NOTIFICATIONS PAGE =======================
function NotificationsPage({ onBack, userId, isPremium }: { onBack: () => void; userId: string; isPremium: boolean }) {
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadNotifications();
  }, [userId]);

  const loadNotifications = async () => {
    const { data } = await supabase.from("notifications").select("*").eq("user_id", userId).order("created_at", { ascending: false }).limit(30);
    setNotifications(data || []);
    setLoading(false);
  };

  const markAllRead = async () => {
    await supabase.from("notifications").update({ is_read: true }).eq("user_id", userId).eq("is_read", false);
    setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
  };

  const createSkincareReminder = async (period: "matin" | "soir") => {
    const title = period === "matin" ? "🌅 Routine Matin" : "🌙 Routine Soir";
    const message = period === "matin"
      ? "N'oubliez pas votre routine skincare du matin : nettoyant, sérum, crème hydratante et SPF !"
      : "C'est l'heure de votre routine du soir : démaquillant, nettoyant, sérum et crème de nuit.";
    
    await supabase.from("notifications").insert({
      user_id: userId,
      title,
      message,
      type: "skincare_reminder",
    });
    loadNotifications();
  };

  const iconForType = (type: string) => {
    switch (type) {
      case "skincare_reminder": return <BellRing className="h-5 w-5 text-primary" />;
      default: return <Bell className="h-5 w-5 text-muted-foreground" />;
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Notifications</h2>
        </div>
        {notifications.some(n => !n.is_read) && (
          <Button variant="ghost" size="sm" onClick={markAllRead} className="text-xs">
            Tout lire
          </Button>
        )}
      </div>

      {/* Premium skincare reminders */}
      {isPremium ? (
        <Card className="shadow-card bg-gradient-to-r from-gold/10 to-gold-light/10 border-gold/20">
          <CardContent className="p-4">
            <div className="flex items-center gap-2 mb-3">
              <Star className="h-5 w-5 text-gold fill-gold" />
              <h3 className="font-display font-semibold">Rappels Skincare Premium</h3>
            </div>
            <p className="text-sm text-muted-foreground mb-3">
              Activez vos rappels matin & soir pour ne jamais oublier votre routine.
            </p>
            <div className="flex gap-2">
              <Button size="sm" onClick={() => createSkincareReminder("matin")} className="bg-gradient-gold text-accent-foreground text-xs">
                <Sun className="h-3 w-3 mr-1" /> Rappel Matin
              </Button>
              <Button size="sm" onClick={() => createSkincareReminder("soir")} variant="outline" className="text-xs">
                <Star className="h-3 w-3 mr-1" /> Rappel Soir
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : (
        <Card className="shadow-card border-dashed border-2 border-gold/30">
          <CardContent className="p-6 text-center">
            <Star className="h-10 w-10 text-gold/40 mx-auto mb-3" />
            <h3 className="font-display font-semibold mb-1">Rappels Skincare</h3>
            <p className="text-sm text-muted-foreground mb-3">
              Passez à l'abonnement Premium pour recevoir des rappels matin & soir de votre routine skincare.
            </p>
            <Button size="sm" className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold">
              Passer Premium — 9 000 FCFA/mois
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Notification list */}
      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
        </div>
      ) : notifications.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <Bell className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune notification</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-2">
          {notifications.map(n => (
            <Card key={n.id} className={`shadow-card transition-all ${!n.is_read ? "border-primary/30 bg-primary/5" : ""}`}>
              <CardContent className="p-4 flex items-start gap-3">
                <div className="w-10 h-10 rounded-full bg-secondary flex items-center justify-center flex-shrink-0">
                  {iconForType(n.type)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className="font-medium text-sm">{n.title}</p>
                    {!n.is_read && <span className="w-2 h-2 rounded-full bg-primary flex-shrink-0" />}
                  </div>
                  <p className="text-xs text-muted-foreground mt-0.5">{n.message}</p>
                  <p className="text-[10px] text-muted-foreground mt-1">
                    {new Date(n.created_at).toLocaleDateString("fr-FR", { day: "numeric", month: "short" })}
                    {" "}
                    {new Date(n.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

// ======================= SUBSCRIPTION PAGE =======================
function SubscriptionPage({ onBack, profile, userId, onProfileUpdate }: { onBack: () => void; profile: any; userId: string; onProfileUpdate: (p: any) => void }) {
  const [selectedPlan, setSelectedPlan] = useState<string | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<"wave" | "orange_money" | null>(null);
  const [phone, setPhone] = useState(profile?.phone || "");
  const [processing, setProcessing] = useState(false);
  const [success, setSuccess] = useState(false);

  const plans = [
    {
      id: "free",
      name: "Gratuit",
      price: 0,
      priceLabel: "0 FCFA",
      period: "/mois",
      features: ["1 scan IA / jour", "Chat IA basique", "Historique 7 jours"],
      color: "border-border",
      badge: null,
      current: !profile?.is_premium,
    },
    {
      id: "simple",
      name: "Simple",
      price: 5500,
      priceLabel: "5 500 FCFA",
      period: "/mois",
      features: ["5 scans IA / jour", "Chat IA illimité", "Historique complet", "1 consultation gratuite/mois"],
      color: "border-primary",
      badge: "Populaire",
      current: false,
    },
    {
      id: "gold",
      name: "Gold Premium",
      price: 9000,
      priceLabel: "9 000 FCFA",
      period: "/mois",
      features: [
        "Scans IA illimités",
        "Chat IA prioritaire",
        "Historique complet",
        "2 consultations gratuites/mois",
        "Rappels skincare matin & soir",
        "Accès produits exclusifs",
        "Support prioritaire",
      ],
      color: "border-gold",
      badge: "Premium ⭐",
      current: profile?.is_premium,
    },
  ];

  const handleSubscribe = async () => {
    if (!selectedPlan || selectedPlan === "free" || !paymentMethod || !phone) return;
    setProcessing(true);

    try {
      // Simulate payment processing (in production, integrate real Wave/OM API)
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Update profile to premium
      const { data } = await supabase
        .from("profiles")
        .update({ is_premium: true, phone })
        .eq("user_id", userId)
        .select()
        .single();

      if (data) onProfileUpdate(data);

      // Create order record
      await supabase.from("orders").insert({
        user_id: userId,
        total: selectedPlan === "gold" ? 9000 : 5500,
        status: "completed",
        payment_method: paymentMethod,
      });

      // Create welcome notification
      await supabase.from("notifications").insert({
        user_id: userId,
        title: "🎉 Bienvenue Premium !",
        message: `Votre abonnement ${selectedPlan === "gold" ? "Gold Premium" : "Simple"} est activé. Profitez de tous vos avantages !`,
        type: "subscription",
      });

      setSuccess(true);
    } catch (err) {
      console.error(err);
    } finally {
      setProcessing(false);
    }
  };

  if (success) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
          <h2 className="text-2xl font-display font-bold">Abonnement</h2>
        </div>
        <Card className="shadow-card">
          <CardContent className="p-8 text-center space-y-4">
            <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mx-auto">
              <Check className="h-10 w-10 text-primary" />
            </div>
            <h3 className="text-2xl font-display font-bold">Paiement réussi ! 🎉</h3>
            <p className="text-muted-foreground">
              Votre abonnement {selectedPlan === "gold" ? "Gold Premium" : "Simple"} est maintenant actif.
              Vous recevrez vos rappels skincare sur le <strong>{phone}</strong>.
            </p>
            <Button onClick={onBack} className="bg-gradient-gold text-accent-foreground font-semibold shadow-gold">
              Retour à l'accueil
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={onBack}><ArrowLeft className="h-5 w-5" /></Button>
        <h2 className="text-2xl font-display font-bold">Abonnement Premium</h2>
      </div>

      {/* Plans */}
      <div className="space-y-4">
        {plans.map(plan => (
          <Card
            key={plan.id}
            className={`shadow-card cursor-pointer transition-all duration-300 border-2 ${
              selectedPlan === plan.id ? plan.color + " ring-2 ring-primary/30 scale-[1.02]" : "border-border hover:border-primary/30"
            } ${plan.current ? "bg-primary/5" : ""}`}
            onClick={() => plan.id !== "free" && setSelectedPlan(plan.id)}
          >
            <CardContent className="p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h3 className="font-display font-bold text-lg">{plan.name}</h3>
                    {plan.badge && (
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                        plan.id === "gold" ? "bg-gradient-gold text-accent-foreground" : "bg-primary text-primary-foreground"
                      }`}>
                        {plan.badge}
                      </span>
                    )}
                  </div>
                  <div className="flex items-baseline gap-1 mt-1">
                    <span className="text-2xl font-display font-bold">{plan.priceLabel}</span>
                    <span className="text-sm text-muted-foreground">{plan.period}</span>
                  </div>
                </div>
                {plan.current && (
                  <span className="px-2 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium">Actuel</span>
                )}
                {selectedPlan === plan.id && !plan.current && (
                  <div className="w-6 h-6 rounded-full bg-primary flex items-center justify-center">
                    <Check className="h-4 w-4 text-primary-foreground" />
                  </div>
                )}
              </div>
              <ul className="space-y-1.5">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-center gap-2 text-sm">
                    <Check className="h-3.5 w-3.5 text-primary flex-shrink-0" />
                    <span>{f}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Payment Method */}
      {selectedPlan && selectedPlan !== "free" && (
        <div className="space-y-4 animate-fade-up">
          <h3 className="font-display font-semibold text-lg">Mode de paiement</h3>
          <div className="grid grid-cols-2 gap-3">
            <Card
              className={`shadow-card cursor-pointer transition-all border-2 ${
                paymentMethod === "wave" ? "border-[hsl(220,80%,50%)] ring-2 ring-[hsl(220,80%,50%)]/20" : "border-border hover:border-[hsl(220,80%,50%)]/40"
              }`}
              onClick={() => setPaymentMethod("wave")}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(220,80%,50%)]/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-[hsl(220,80%,50%)]">W</span>
                </div>
                <h4 className="font-semibold text-sm">Wave</h4>
                <p className="text-[11px] text-muted-foreground">Paiement mobile rapide</p>
                {paymentMethod === "wave" && (
                  <div className="w-5 h-5 rounded-full bg-[hsl(220,80%,50%)] flex items-center justify-center mx-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
            <Card
              className={`shadow-card cursor-pointer transition-all border-2 ${
                paymentMethod === "orange_money" ? "border-[hsl(25,100%,50%)] ring-2 ring-[hsl(25,100%,50%)]/20" : "border-border hover:border-[hsl(25,100%,50%)]/40"
              }`}
              onClick={() => setPaymentMethod("orange_money")}
            >
              <CardContent className="p-4 text-center space-y-2">
                <div className="w-14 h-14 rounded-2xl bg-[hsl(25,100%,50%)]/10 flex items-center justify-center mx-auto">
                  <span className="text-2xl font-bold text-[hsl(25,100%,50%)]">OM</span>
                </div>
                <h4 className="font-semibold text-sm">Orange Money</h4>
                <p className="text-[11px] text-muted-foreground">Paiement via Orange</p>
                {paymentMethod === "orange_money" && (
                  <div className="w-5 h-5 rounded-full bg-[hsl(25,100%,50%)] flex items-center justify-center mx-auto">
                    <Check className="h-3 w-3 text-primary-foreground" />
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Phone number */}
          {paymentMethod && (
            <div className="space-y-3 animate-fade-up">
              <label className="text-sm font-medium">Numéro {paymentMethod === "wave" ? "Wave" : "Orange Money"}</label>
              <Input
                type="tel"
                placeholder="+221 7X XXX XX XX"
                value={phone}
                onChange={e => setPhone(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Ce numéro sera aussi utilisé pour vos rappels skincare matin et soir.
              </p>

              <Card className="shadow-card bg-secondary/50">
                <CardContent className="p-4">
                  <h4 className="font-medium text-sm mb-2">📋 Récapitulatif</h4>
                  <div className="space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Forfait</span>
                      <span className="font-semibold">{selectedPlan === "gold" ? "Gold Premium" : "Simple"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Prix</span>
                      <span className="font-semibold">{selectedPlan === "gold" ? "9 000" : "5 500"} FCFA/mois</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Paiement</span>
                      <span className="font-semibold">{paymentMethod === "wave" ? "Wave" : "Orange Money"}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Button
                className="w-full bg-gradient-gold text-accent-foreground font-semibold shadow-gold h-12 text-base"
                disabled={!phone || processing}
                onClick={handleSubscribe}
              >
                {processing ? (
                  <><Loader2 className="h-5 w-5 mr-2 animate-spin" /> Traitement en cours...</>
                ) : (
                  <><CreditCard className="h-5 w-5 mr-2" /> Payer {selectedPlan === "gold" ? "9 000" : "5 500"} FCFA</>
                )}
              </Button>

              <p className="text-[11px] text-center text-muted-foreground">
                🔒 Paiement sécurisé. Vous pouvez annuler à tout moment.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ======================= MAIN DASHBOARD =======================
export default function PatientDashboard() {
  usePageMeta("Mon espace patient");
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [analyses, setAnalyses] = useState<any[]>([]);
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [activeTab, setActiveTab] = useState<Tab>("home");
  const [unreadNotifs, setUnreadNotifs] = useState(0);

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => setProfile(data));
    supabase.from("skin_analyses").select("*").eq("user_id", user.id).order("created_at", { ascending: false }).limit(20).then(({ data }) => setAnalyses(data || []));
    supabase.from("prescriptions").select("*").eq("patient_id", user.id).order("created_at", { ascending: false }).limit(5).then(({ data }) => setPrescriptions(data || []));
    supabase.from("notifications").select("id", { count: "exact", head: true }).eq("user_id", user.id).eq("is_read", false).then(({ count }) => setUnreadNotifs(count || 0));
  }, [user]);

  const lastAnalysis = analyses[0];

  const stats = [
    { label: "Hydratation", value: lastAnalysis?.hydration ?? "--", icon: Droplets, color: "text-primary" },
    { label: "Élasticité", value: lastAnalysis?.elasticity ?? "--", icon: Activity, color: "text-accent" },
    { label: "Clarté", value: lastAnalysis?.clarity ?? "--", icon: Sun, color: "text-gold" },
    { label: "Score", value: lastAnalysis?.score ?? "--", icon: Star, color: "text-primary" },
  ];

  const navItems = [
    { tab: "home" as Tab, icon: Activity, label: "Accueil" },
    { tab: "ai-analysis" as Tab, icon: Camera, label: "Scan" },
    { tab: "history" as Tab, icon: History, label: "Photos" },
    { tab: "consultation" as Tab, icon: Stethoscope, label: "Docteur" },
    { tab: "shop" as Tab, icon: ShoppingBag, label: "Boutique" },
  ];

  // Sub-pages
  if (activeTab === "ai-analysis") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <AIAnalysisPage onBack={() => setActiveTab("home")} userId={user!.id} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "ai-chat") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <AIChatPage onBack={() => setActiveTab("home")} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "consultation") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <ConsultationPage onBack={() => setActiveTab("home")} userId={user!.id} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "shop") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <ShopPage onBack={() => setActiveTab("home")} userId={user!.id} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "profile") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <ProfilePage onBack={() => setActiveTab("home")} profile={profile} userId={user!.id} onProfileUpdate={setProfile} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "history") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <PhotoHistoryPage onBack={() => setActiveTab("home")} analyses={analyses} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "notifications") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <NotificationsPage onBack={() => setActiveTab("home")} userId={user!.id} isPremium={profile?.is_premium || false} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }
  if (activeTab === "subscription") {
    return (
      <div className="min-h-screen bg-background pb-20">
        <div className="container py-6">
          <SubscriptionPage onBack={() => setActiveTab("home")} profile={profile} userId={user!.id} onProfileUpdate={setProfile} />
        </div>
        <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>
    );
  }

  // HOME
  return (
    <div className="min-h-screen bg-background pb-20">
      {/* Top Nav */}
      <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border">
        <div className="container flex items-center justify-between h-16">
          <h1 className="text-xl font-display font-bold">
            Sunu <span className="text-gradient-gold">Derma</span>
          </h1>
          <div className="flex items-center gap-3">
            <button onClick={() => setActiveTab("notifications")} className="relative">
              <Bell className="h-5 w-5 text-muted-foreground" />
              {unreadNotifs > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-destructive text-destructive-foreground text-[9px] flex items-center justify-center font-bold">
                  {unreadNotifs}
                </span>
              )}
            </button>
            <button onClick={() => setActiveTab("profile")} className="flex items-center gap-2">
              <div className="w-9 h-9 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {profile?.avatar_url ? (
                  <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <User className="h-4 w-4 text-primary" />
                )}
              </div>
            </button>
          </div>
        </div>
      </header>

      <main className="container py-6 space-y-6">
        {/* Welcome */}
        <div className="animate-fade-up">
          <h2 className="text-2xl md:text-3xl font-display font-bold">
            Bonjour, <span className="text-gradient-teal">{profile?.full_name?.split(" ")[0] || "Patient"}</span> 👋
          </h2>
          <p className="text-muted-foreground mt-1 text-sm">Voici l'état de votre peau aujourd'hui.</p>
        </div>

        {/* Weather */}
        <WeatherWidget />

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {stats.map((s, i) => (
            <Card key={s.label} className="shadow-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
              <CardContent className="p-4">
                <div className="flex items-center gap-2 mb-2">
                  <div className="w-8 h-8 rounded-lg bg-secondary flex items-center justify-center">
                    <s.icon className={`h-4 w-4 ${s.color}`} />
                  </div>
                  <span className="text-xs text-muted-foreground">{s.label}</span>
                </div>
                <p className="text-2xl font-display font-bold">{s.value}<span className="text-sm text-muted-foreground font-normal">/100</span></p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { icon: Camera, label: "Analyse IA", desc: "Scanner peau", color: "bg-primary/10", iconColor: "text-primary", tab: "ai-analysis" as Tab },
            { icon: Bot, label: "Chat IA", desc: "Assistant derma", color: "bg-accent/10", iconColor: "text-accent-foreground", tab: "ai-chat" as Tab },
            { icon: History, label: "Mes Photos", desc: "Historique visuel", color: "bg-gold/10", iconColor: "text-gold", tab: "history" as Tab },
            { icon: Stethoscope, label: "Consultation", desc: "Voir un médecin", color: "bg-primary/10", iconColor: "text-primary", tab: "consultation" as Tab },
          ].map((action, i) => (
            <Card
              key={action.label}
              className="shadow-card cursor-pointer hover:shadow-lg hover:-translate-y-1 transition-all duration-300 animate-fade-up"
              style={{ animationDelay: `${(i + 4) * 0.08}s` }}
              onClick={() => setActiveTab(action.tab)}
            >
              <CardContent className="p-4 text-center">
                <div className={`w-12 h-12 rounded-xl ${action.color} flex items-center justify-center mx-auto mb-2`}>
                  <action.icon className={`h-6 w-6 ${action.iconColor}`} />
                </div>
                <h3 className="font-display font-semibold text-sm">{action.label}</h3>
                <p className="text-[11px] text-muted-foreground">{action.desc}</p>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Premium CTA */}
        {!profile?.is_premium && (
          <Card
            className="shadow-card cursor-pointer hover:shadow-lg transition-all border-2 border-gold/30 bg-gradient-to-r from-gold/5 to-primary/5 animate-fade-up"
            onClick={() => setActiveTab("subscription")}
          >
            <CardContent className="p-5 flex items-center gap-4">
              <div className="w-14 h-14 rounded-2xl bg-gradient-gold flex items-center justify-center flex-shrink-0">
                <Star className="h-7 w-7 text-accent-foreground" />
              </div>
              <div className="flex-1">
                <h3 className="font-display font-bold">Passez en Premium ⭐</h3>
                <p className="text-sm text-muted-foreground">Scans illimités, rappels skincare, consultations gratuites</p>
              </div>
              <ChevronRight className="h-5 w-5 text-muted-foreground" />
            </CardContent>
          </Card>
        )}

        {/* Skin Score Chart */}
        <SkinScoreChart analyses={analyses} />

        {/* Prescriptions */}
        <Card className="shadow-card animate-fade-up">
          <CardHeader className="pb-2">
            <CardTitle className="font-display flex items-center gap-2 text-lg">
              <Pill className="h-5 w-5 text-primary" />
              Ma Routine Prescrite
            </CardTitle>
          </CardHeader>
          <CardContent>
            {prescriptions.length === 0 ? (
              <p className="text-muted-foreground text-center py-6 text-sm">
                Aucune prescription. Consultez un dermatologue pour votre routine personnalisée.
              </p>
            ) : (
              <div className="space-y-2">
                {prescriptions.map(p => (
                  <div key={p.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                    <Pill className="h-4 w-4 text-accent flex-shrink-0" />
                    <div className="flex-1 min-w-0">
                      <p className="font-medium text-sm truncate">{p.notes || "Prescription"}</p>
                      <p className="text-xs text-muted-foreground">{new Date(p.created_at).toLocaleDateString("fr-FR")}</p>
                    </div>
                    {!p.is_read && (
                      <span className="px-2 py-0.5 text-[10px] rounded-full bg-accent text-accent-foreground font-medium">Nouveau</span>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
      </main>

      {/* Bottom Navigation */}
      <BottomNav navItems={navItems} activeTab={activeTab} onTabChange={setActiveTab} />
    </div>
  );
}

function BottomNav({ navItems, activeTab, onTabChange }: { navItems: { tab: Tab; icon: any; label: string }[]; activeTab: Tab; onTabChange: (t: Tab) => void }) {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 bg-background/95 backdrop-blur-lg border-t border-border">
      <div className="container flex items-center justify-around h-16">
        {navItems.map(item => (
          <button
            key={item.tab}
            onClick={() => onTabChange(item.tab)}
            className={`flex flex-col items-center gap-1 px-3 py-1.5 rounded-lg transition-colors ${
              activeTab === item.tab ? "text-primary" : "text-muted-foreground"
            }`}
          >
            <item.icon className="h-5 w-5" />
            <span className="text-[10px] font-medium">{item.label}</span>
          </button>
        ))}
      </div>
    </nav>
  );
}
