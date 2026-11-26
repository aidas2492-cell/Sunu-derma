import { usePageMeta } from "@/lib/seo";
import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Users, MessageCircle, Pill, LogOut, LayoutDashboard,
  Send, ChevronRight, Search, Calendar, ShoppingBag, Package,
  ArrowLeft, Loader2, Plus, Check, Eye, Stethoscope, Activity,
  Star, User, Camera, CreditCard
} from "lucide-react";
import {
  SidebarProvider, Sidebar, SidebarContent, SidebarGroup,
  SidebarGroupContent, SidebarGroupLabel, SidebarMenu,
  SidebarMenuButton, SidebarMenuItem, SidebarTrigger, useSidebar,
} from "@/components/ui/sidebar";

type Tab = "overview" | "patients" | "chat" | "prescriptions" | "agenda" | "catalog" | "profile";

function DoctorSidebarContent({ onTabChange, activeTab }: { onTabChange: (t: Tab) => void; activeTab: Tab }) {
  const sidebar = useSidebar();
  const collapsed = sidebar.state === "collapsed";

  const menuItems: { title: string; icon: any; tab: Tab }[] = [
    { title: "Tableau de bord", icon: LayoutDashboard, tab: "overview" },
    { title: "Patients", icon: Users, tab: "patients" },
    { title: "Messagerie", icon: MessageCircle, tab: "chat" },
    { title: "Ordonnances", icon: Pill, tab: "prescriptions" },
    { title: "Agenda", icon: Calendar, tab: "agenda" },
    { title: "Catalogue", icon: ShoppingBag, tab: "catalog" },
    { title: "Mon Profil", icon: User, tab: "profile" },
  ];

  return (
    <Sidebar className={collapsed ? "w-14" : "w-60"} collapsible="icon">
      <div className="p-4">
        {!collapsed && (
          <h2 className="text-lg font-display font-bold text-sidebar-foreground">
            Sunu <span className="text-sidebar-primary">Derma</span>
            <span className="text-xs ml-2 opacity-60">PRO</span>
          </h2>
        )}
      </div>
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel className="text-sidebar-foreground/50">Menu</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {menuItems.map((item) => (
                <SidebarMenuItem key={item.tab}>
                  <SidebarMenuButton
                    onClick={() => onTabChange(item.tab)}
                    className={`cursor-pointer ${activeTab === item.tab ? "bg-sidebar-accent text-sidebar-accent-foreground" : ""}`}
                  >
                    <item.icon className="h-4 w-4 mr-2" />
                    {!collapsed && <span>{item.title}</span>}
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}

function OverviewTab() {
  const [stats, setStats] = useState({ patients: 0, consultations: 0, prescriptions: 0, pendingConsults: 0 });
  const { user } = useAuth();

  useEffect(() => {
    if (!user) return;
    Promise.all([
      supabase.from("consultations").select("id, status", { count: "exact" }).eq("doctor_id", user.id),
      supabase.from("prescriptions").select("id", { count: "exact", head: true }).eq("doctor_id", user.id),
    ]).then(([c, p]) => {
      const consults = c.data || [];
      const uniquePatients = new Set(consults.map((x: any) => x.id)).size; // approximate
      setStats({
        patients: c.count || 0,
        consultations: c.count || 0,
        prescriptions: p.count || 0,
        pendingConsults: consults.filter((x: any) => x.status === "pending").length,
      });
    });
  }, [user]);

  const cards = [
    { label: "Consultations", value: stats.consultations, icon: MessageCircle, color: "text-primary" },
    { label: "Ordonnances", value: stats.prescriptions, icon: Pill, color: "text-accent" },
    { label: "En attente", value: stats.pendingConsults, icon: Activity, color: "text-gold" },
  ];

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Tableau de bord</h2>
      <div className="grid md:grid-cols-3 gap-4">
        {cards.map((c, i) => (
          <Card key={c.label} className="shadow-card animate-fade-up" style={{ animationDelay: `${i * 0.1}s` }}>
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-3">
                <div className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center">
                  <c.icon className={`h-5 w-5 ${c.color}`} />
                </div>
                <span className="text-sm text-muted-foreground">{c.label}</span>
              </div>
              <p className="text-3xl font-display font-bold">{c.value}</p>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}

function PatientsTab({ onSelectPatient }: { onSelectPatient: (p: any) => void }) {
  const { user } = useAuth();
  const [patients, setPatients] = useState<any[]>([]);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user) return;
    supabase.from("consultations").select("patient_id").eq("doctor_id", user.id).then(async ({ data }) => {
      if (!data) return;
      const ids = [...new Set(data.map((c) => c.patient_id))];
      if (ids.length === 0) return;
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      setPatients(profiles || []);
    });
  }, [user]);

  const filtered = patients.filter((p) => p.full_name?.toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Mes Patients</h2>
      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input placeholder="Rechercher un patient..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10" />
      </div>
      {filtered.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucun patient trouvé.</p>
      ) : (
        <div className="space-y-3">
          {filtered.map((p, i) => (
            <Card key={p.id} className="shadow-card animate-fade-up cursor-pointer hover:shadow-lg transition-all" style={{ animationDelay: `${i * 0.05}s` }} onClick={() => onSelectPatient(p)}>
              <CardContent className="p-4 flex items-center gap-4">
                <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                  <Users className="h-5 w-5 text-primary" />
                </div>
                <div className="flex-1">
                  <p className="font-medium">{p.full_name || "Patient"}</p>
                  <p className="text-xs text-muted-foreground">Type: {p.skin_type || "Non défini"}</p>
                </div>
                <ChevronRight className="h-4 w-4 text-muted-foreground" />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function ChatTab() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [selectedConsult, setSelectedConsult] = useState<any>(null);
  const [messages, setMessages] = useState<any[]>([]);
  const [input, setInput] = useState("");
  const [patientProfiles, setPatientProfiles] = useState<Record<string, any>>({});
  const chatEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user) return;
    supabase.from("consultations").select("*").eq("doctor_id", user.id).order("updated_at", { ascending: false }).then(async ({ data }) => {
      setConsultations(data || []);
      if (data && data.length > 0) {
        const patientIds = [...new Set(data.map(c => c.patient_id))];
        const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", patientIds);
        const map: Record<string, any> = {};
        (profiles || []).forEach(p => { map[p.user_id] = p; });
        setPatientProfiles(map);
      }
    });
  }, [user]);

  useEffect(() => {
    if (!selectedConsult) return;
    supabase.from("messages").select("*").eq("consultation_id", selectedConsult.id).order("created_at", { ascending: true }).then(({ data }) => setMessages(data || []));

    const channel = supabase
      .channel(`doc-messages-${selectedConsult.id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "messages", filter: `consultation_id=eq.${selectedConsult.id}` },
        (payload) => { setMessages(prev => [...prev, payload.new]); }
      ).subscribe();

    return () => { supabase.removeChannel(channel); };
  }, [selectedConsult]);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const sendMessage = async () => {
    if (!input.trim() || !selectedConsult || !user) return;
    await supabase.from("messages").insert({
      consultation_id: selectedConsult.id,
      sender_id: user.id,
      content: input.trim(),
    });
    setInput("");
  };

  if (selectedConsult) {
    const patientName = patientProfiles[selectedConsult.patient_id]?.full_name || "Patient";
    return (
      <div className="flex flex-col h-[calc(100vh-8rem)]">
        <div className="flex items-center gap-3 pb-4 border-b border-border">
          <Button variant="ghost" size="icon" onClick={() => setSelectedConsult(null)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Users className="h-5 w-5 text-primary" />
          </div>
          <div className="flex-1">
            <h3 className="font-display font-semibold">{patientName}</h3>
            <p className="text-xs text-muted-foreground capitalize">{selectedConsult.status}</p>
          </div>
          <Button variant="outline" size="sm" onClick={async () => {
            await supabase.from("consultations").update({ status: "active" }).eq("id", selectedConsult.id);
            setSelectedConsult({ ...selectedConsult, status: "active" });
          }}>
            Accepter
          </Button>
        </div>

        <div className="flex-1 overflow-y-auto space-y-3 py-4">
          {messages.map((m: any) => (
            <div key={m.id} className={`flex ${m.sender_id === user!.id ? "justify-end" : "justify-start"}`}>
              <div className={`max-w-[80%] px-4 py-3 rounded-2xl text-sm ${
                m.sender_id === user!.id
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

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Messagerie</h2>
      {consultations.length === 0 ? (
        <Card className="shadow-card">
          <CardContent className="p-12 text-center">
            <MessageCircle className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <p className="text-muted-foreground">Aucune consultation en cours.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-3">
          {consultations.map(c => {
            const name = patientProfiles[c.patient_id]?.full_name || "Patient";
            return (
              <Card key={c.id} className="shadow-card cursor-pointer hover:shadow-lg transition-all" onClick={() => setSelectedConsult(c)}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
                    <Users className="h-5 w-5 text-primary" />
                  </div>
                  <div className="flex-1">
                    <p className="font-medium">{name}</p>
                    <p className="text-xs text-muted-foreground">
                      {new Date(c.updated_at || c.created_at).toLocaleDateString("fr-FR")} • <span className="capitalize">{c.status}</span>
                    </p>
                  </div>
                  {c.status === "pending" && (
                    <span className="px-2 py-1 text-xs rounded-full bg-accent/10 text-accent font-medium">Nouveau</span>
                  )}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}

function PrescriptionsTab() {
  const { user } = useAuth();
  const [prescriptions, setPrescriptions] = useState<any[]>([]);
  const [showCreate, setShowCreate] = useState(false);
  const [patients, setPatients] = useState<any[]>([]);
  const [selectedPatient, setSelectedPatient] = useState("");
  const [notes, setNotes] = useState("");
  const [products, setProducts] = useState<any[]>([]);
  const [selectedProducts, setSelectedProducts] = useState<string[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (!user) return;
    supabase.from("prescriptions").select("*").eq("doctor_id", user.id).order("created_at", { ascending: false }).then(({ data }) => setPrescriptions(data || []));
    // Load patients
    supabase.from("consultations").select("patient_id").eq("doctor_id", user.id).then(async ({ data }) => {
      if (!data) return;
      const ids = [...new Set(data.map(c => c.patient_id))];
      if (ids.length === 0) return;
      const { data: profiles } = await supabase.from("profiles").select("*").in("user_id", ids);
      setPatients(profiles || []);
    });
    supabase.from("products").select("*").then(({ data }) => setProducts(data || []));
  }, [user]);

  const createPrescription = async () => {
    if (!selectedPatient || !notes.trim() || !user) return;
    setCreating(true);
    try {
      await supabase.from("prescriptions").insert({
        doctor_id: user.id,
        patient_id: selectedPatient,
        notes: notes.trim(),
        product_ids: selectedProducts,
      });
      setShowCreate(false);
      setNotes("");
      setSelectedProducts([]);
      // Reload
      const { data } = await supabase.from("prescriptions").select("*").eq("doctor_id", user.id).order("created_at", { ascending: false });
      setPrescriptions(data || []);
    } finally {
      setCreating(false);
    }
  };

  if (showCreate) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" onClick={() => setShowCreate(false)}>
            <ArrowLeft className="h-5 w-5" />
          </Button>
          <h2 className="text-2xl font-display font-bold">Nouvelle Ordonnance</h2>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-sm font-medium mb-1 block">Patient</label>
            <select
              value={selectedPatient}
              onChange={e => setSelectedPatient(e.target.value)}
              className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
            >
              <option value="">Sélectionner un patient</option>
              {patients.map(p => (
                <option key={p.user_id} value={p.user_id}>{p.full_name}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Notes / Instructions</label>
            <Textarea value={notes} onChange={e => setNotes(e.target.value)} placeholder="Appliquer 2x/jour sur les zones touchées..." rows={4} />
          </div>

          <div>
            <label className="text-sm font-medium mb-1 block">Produits recommandés</label>
            <div className="grid grid-cols-1 gap-2 max-h-48 overflow-y-auto">
              {products.map(p => (
                <label key={p.id} className={`flex items-center gap-3 p-3 rounded-lg border cursor-pointer transition-colors ${
                  selectedProducts.includes(p.id) ? "border-primary bg-primary/5" : "border-border"
                }`}>
                  <input
                    type="checkbox"
                    checked={selectedProducts.includes(p.id)}
                    onChange={() => {
                      setSelectedProducts(prev =>
                        prev.includes(p.id) ? prev.filter(id => id !== p.id) : [...prev, p.id]
                      );
                    }}
                    className="rounded"
                  />
                  <div className="flex-1">
                    <p className="text-sm font-medium">{p.name}</p>
                    <p className="text-xs text-muted-foreground">{p.price.toLocaleString()} FCFA</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <Button onClick={createPrescription} disabled={creating || !selectedPatient || !notes.trim()} className="w-full bg-gradient-gold text-accent-foreground font-semibold">
            {creating ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <Pill className="h-4 w-4 mr-2" />}
            Créer l'ordonnance
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-display font-bold">Ordonnances</h2>
        <Button onClick={() => setShowCreate(true)} className="bg-gradient-gold text-accent-foreground font-semibold">
          <Plus className="h-4 w-4 mr-2" /> Nouvelle
        </Button>
      </div>
      {prescriptions.length === 0 ? (
        <p className="text-muted-foreground text-center py-12">Aucune ordonnance créée.</p>
      ) : (
        <div className="space-y-3">
          {prescriptions.map((p, i) => (
            <Card key={p.id} className="shadow-card animate-fade-up" style={{ animationDelay: `${i * 0.05}s` }}>
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-medium">{p.notes || "Ordonnance"}</p>
                    <p className="text-xs text-muted-foreground mt-1">
                      {new Date(p.created_at).toLocaleDateString("fr-FR")}
                      {p.product_ids?.length > 0 && ` • ${p.product_ids.length} produit(s)`}
                    </p>
                  </div>
                  {p.is_read ? (
                    <span className="px-2 py-1 text-xs rounded-full bg-primary/10 text-primary font-medium flex items-center gap-1">
                      <Eye className="h-3 w-3" /> Lu
                    </span>
                  ) : (
                    <span className="px-2 py-1 text-xs rounded-full bg-muted text-muted-foreground font-medium">Non lu</span>
                  )}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function AgendaTab() {
  const { user } = useAuth();
  const [consultations, setConsultations] = useState<any[]>([]);
  const [appointments, setAppointments] = useState<any[]>([]);
  const [profiles, setProfiles] = useState<Record<string, any>>({});

  useEffect(() => {
    if (!user) return;
    // Load consultations
    supabase.from("consultations").select("*").eq("doctor_id", user.id).order("created_at", { ascending: false }).then(async ({ data }) => {
      setConsultations(data || []);
      const patientIds = [...new Set((data || []).map(c => c.patient_id))];
      if (patientIds.length > 0) {
        const { data: p } = await supabase.from("profiles").select("*").in("user_id", patientIds);
        const map: Record<string, any> = {};
        (p || []).forEach(pr => { map[pr.user_id] = pr; });
        setProfiles(prev => ({ ...prev, ...map }));
      }
    });
    // Load appointments
    supabase.from("appointments").select("*").eq("doctor_id", user.id).order("appointment_date", { ascending: true }).then(async ({ data }) => {
      setAppointments(data || []);
      const patientIds = [...new Set((data || []).map(a => a.patient_id))];
      if (patientIds.length > 0) {
        const { data: p } = await supabase.from("profiles").select("*").in("user_id", patientIds);
        const map: Record<string, any> = {};
        (p || []).forEach(pr => { map[pr.user_id] = pr; });
        setProfiles(prev => ({ ...prev, ...map }));
      }
    });
  }, [user]);

  const handleAppointmentStatus = async (id: string, status: string) => {
    await supabase.from("appointments").update({ status }).eq("id", id);
    setAppointments(prev => prev.map(a => a.id === id ? { ...a, status } : a));
  };

  const pending = consultations.filter(c => c.status === "pending");
  const active = consultations.filter(c => c.status === "active");
  const completed = consultations.filter(c => c.status === "completed");

  const pendingAppts = appointments.filter(a => a.status === "pending");
  const confirmedAppts = appointments.filter(a => a.status === "confirmed");

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Agenda</h2>

      {/* Appointments section */}
      {(pendingAppts.length > 0 || confirmedAppts.length > 0) && (
        <>
          <h3 className="font-display font-semibold flex items-center gap-2 text-lg">
            <Calendar className="h-5 w-5 text-primary" /> Rendez-vous
          </h3>

          {pendingAppts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                Demandes en attente
                <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-accent/10 text-accent">{pendingAppts.length}</span>
              </h4>
              <div className="space-y-2">
                {pendingAppts.map(a => (
                  <Card key={a.id} className="shadow-card border-l-4 border-l-accent">
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div>
                          <p className="font-medium">{profiles[a.patient_id]?.full_name || "Patient"}</p>
                          <p className="text-sm text-muted-foreground">
                            {new Date(a.appointment_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                            {" à "}
                            {new Date(a.appointment_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                          </p>
                          {a.notes && <p className="text-xs text-muted-foreground mt-1 italic">"{a.notes}"</p>}
                        </div>
                        <div className="flex gap-2">
                          <Button size="sm" onClick={() => handleAppointmentStatus(a.id, "confirmed")} className="bg-primary text-primary-foreground text-xs">
                            <Check className="h-3 w-3 mr-1" /> Accepter
                          </Button>
                          <Button size="sm" variant="outline" onClick={() => handleAppointmentStatus(a.id, "cancelled")} className="text-xs text-destructive">
                            Refuser
                          </Button>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}

          {confirmedAppts.length > 0 && (
            <div>
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Rendez-vous confirmés</h4>
              <div className="space-y-2">
                {confirmedAppts.map(a => (
                  <Card key={a.id} className="shadow-card border-l-4 border-l-primary">
                    <CardContent className="p-4 flex items-center gap-4">
                      <Calendar className="h-5 w-5 text-primary" />
                      <div className="flex-1">
                        <p className="font-medium text-sm">{profiles[a.patient_id]?.full_name || "Patient"}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(a.appointment_date).toLocaleDateString("fr-FR", { weekday: "long", day: "numeric", month: "long" })}
                          {" à "}
                          {new Date(a.appointment_date).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                        </p>
                      </div>
                      <Button size="sm" variant="outline" onClick={() => handleAppointmentStatus(a.id, "completed")} className="text-xs">
                        Terminé
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          )}
        </>
      )}

      {/* Consultations */}
      {[
        { title: "En attente", items: pending, color: "bg-accent/10 text-accent" },
        { title: "En cours", items: active, color: "bg-primary/10 text-primary" },
        { title: "Terminées", items: completed, color: "bg-muted text-muted-foreground" },
      ].map(group => (
        <div key={group.title}>
          <h3 className="font-display font-semibold mb-3 flex items-center gap-2">
            {group.title}
            <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${group.color}`}>{group.items.length}</span>
          </h3>
          {group.items.length === 0 ? (
            <p className="text-sm text-muted-foreground">Aucune consultation.</p>
          ) : (
            <div className="space-y-2">
              {group.items.map(c => (
                <Card key={c.id} className="shadow-card">
                  <CardContent className="p-4 flex items-center gap-4">
                    <Calendar className="h-5 w-5 text-muted-foreground" />
                    <div className="flex-1">
                      <p className="font-medium text-sm">{profiles[c.patient_id]?.full_name || "Patient"}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(c.created_at).toLocaleDateString("fr-FR")} à {new Date(c.created_at).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" })}
                      </p>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

function CatalogTab() {
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    supabase.from("products").select("*").order("category").then(({ data }) => setProducts(data || []));
  }, []);

  const categories = [...new Set(products.map(p => p.category))];

  const toggleStock = async (productId: string, currentStock: boolean) => {
    await supabase.from("products").update({ in_stock: !currentStock }).eq("id", productId);
    setProducts(prev => prev.map(p => p.id === productId ? { ...p, in_stock: !currentStock } : p));
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-display font-bold">Catalogue Produits</h2>
      {categories.map(cat => (
        <div key={cat}>
          <h3 className="font-display font-semibold mb-3">{cat}</h3>
          <div className="grid md:grid-cols-2 gap-3">
            {products.filter(p => p.category === cat).map(p => (
              <Card key={p.id} className={`shadow-card ${!p.in_stock ? "opacity-60" : ""}`}>
                <CardContent className="p-4 flex items-center gap-4">
                  <div className="w-12 h-12 rounded-lg bg-secondary flex items-center justify-center flex-shrink-0">
                    <Package className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-sm truncate">{p.name}</p>
                    <p className="text-xs text-muted-foreground truncate">{p.description}</p>
                    <p className="text-sm font-bold text-primary mt-1">{p.price.toLocaleString()} FCFA</p>
                  </div>
                  <Button
                    variant={p.in_stock ? "outline" : "destructive"}
                    size="sm"
                    onClick={() => toggleStock(p.id, p.in_stock)}
                  >
                    {p.in_stock ? "En stock" : "Rupture"}
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

function DoctorProfileTab() {
  const { user, signOut } = useAuth();
  const [profile, setProfile] = useState<any>(null);
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const avatarRef = useRef<HTMLInputElement>(null);
  const [form, setForm] = useState({ full_name: "", phone: "", consultation_fee: 0 });

  useEffect(() => {
    if (!user) return;
    supabase.from("profiles").select("*").eq("user_id", user.id).maybeSingle().then(({ data }) => {
      setProfile(data);
      if (data) setForm({ full_name: data.full_name || "", phone: data.phone || "", consultation_fee: data.consultation_fee || 0 });
    });
  }, [user]);

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user) return;
    setUploadingAvatar(true);
    try {
      const ext = file.name.split(".").pop();
      const path = `${user.id}/avatar.${ext}`;
      await supabase.storage.from("avatars").upload(path, file, { upsert: true });
      const { data: { publicUrl } } = supabase.storage.from("avatars").getPublicUrl(path);
      const avatarUrl = `${publicUrl}?t=${Date.now()}`;
      await supabase.from("profiles").update({ avatar_url: avatarUrl }).eq("user_id", user.id);
      setProfile((p: any) => ({ ...p, avatar_url: avatarUrl }));
    } catch (err) { console.error(err); }
    finally { setUploadingAvatar(false); }
  };

  const saveProfile = async () => {
    if (!user) return;
    setSaving(true);
    try {
      const { data } = await supabase.from("profiles").update({
        full_name: form.full_name,
        phone: form.phone,
        consultation_fee: form.consultation_fee,
      }).eq("user_id", user.id).select().single();
      if (data) setProfile(data);
      setEditing(false);
    } finally { setSaving(false); }
  };

  return (
    <div className="space-y-6 max-w-lg">
      <h2 className="text-2xl font-display font-bold">Mon Profil Médecin</h2>
      <Card className="shadow-card">
        <CardContent className="p-6">
          <div className="text-center mb-6">
            <input type="file" accept="image/*" ref={avatarRef} onChange={handleAvatarUpload} className="hidden" />
            <div className="relative w-24 h-24 mx-auto mb-4 cursor-pointer" onClick={() => avatarRef.current?.click()}>
              <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center overflow-hidden">
                {uploadingAvatar ? <Loader2 className="h-8 w-8 animate-spin text-primary" /> :
                  profile?.avatar_url ? <img src={profile.avatar_url} alt="Avatar" className="w-full h-full object-cover" /> :
                  <User className="h-10 w-10 text-primary" />}
              </div>
              <div className="absolute bottom-0 right-0 w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center shadow-lg">
                <Camera className="h-4 w-4" />
              </div>
            </div>
            <h3 className="text-xl font-display font-bold">{profile?.full_name || "Docteur"}</h3>
            <p className="text-sm text-muted-foreground">Dermatologue</p>
            {profile?.consultation_fee > 0 && (
              <p className="text-sm font-bold text-primary mt-1">{profile.consultation_fee.toLocaleString()} FCFA / consultation</p>
            )}
          </div>

          {editing ? (
            <div className="space-y-4 border-t border-border pt-4">
              <div>
                <label className="text-sm font-medium mb-1 block">Nom complet</label>
                <Input value={form.full_name} onChange={e => setForm(f => ({ ...f, full_name: e.target.value }))} />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Téléphone</label>
                <Input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))} placeholder="+221 77 000 00 00" />
              </div>
              <div>
                <label className="text-sm font-medium mb-1 block">Tarif consultation (FCFA)</label>
                <Input type="number" value={form.consultation_fee} onChange={e => setForm(f => ({ ...f, consultation_fee: parseInt(e.target.value) || 0 }))} placeholder="15000" />
                <p className="text-xs text-muted-foreground mt-1">Ce tarif sera visible par les patients.</p>
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
                { label: "Tarif consultation", value: profile?.consultation_fee ? `${profile.consultation_fee.toLocaleString()} FCFA` : "Non défini" },
              ].map(item => (
                <div key={item.label} className="flex justify-between items-center p-3 rounded-lg bg-secondary/50">
                  <span className="text-sm text-muted-foreground">{item.label}</span>
                  <span className="text-sm font-medium">{item.value}</span>
                </div>
              ))}
              <Button variant="outline" className="w-full" onClick={() => setEditing(true)}>Modifier mon profil</Button>
            </div>
          )}
        </CardContent>
      </Card>
      <Button variant="outline" className="w-full" onClick={signOut}>
        <LogOut className="h-4 w-4 mr-2" /> Se déconnecter
      </Button>
    </div>
  );
}

export default function DoctorDashboard() {
  usePageMeta("Espace médecin");
  const { signOut } = useAuth();
  const [activeTab, setActiveTab] = useState<Tab>("overview");

  const tabContent: Record<Tab, React.ReactNode> = {
    overview: <OverviewTab />,
    patients: <PatientsTab onSelectPatient={() => setActiveTab("chat")} />,
    chat: <ChatTab />,
    prescriptions: <PrescriptionsTab />,
    agenda: <AgendaTab />,
    catalog: <CatalogTab />,
    profile: <DoctorProfileTab />,
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <DoctorSidebarContent onTabChange={setActiveTab} activeTab={activeTab} />
        <div className="flex-1 flex flex-col">
          <header className="sticky top-0 z-40 bg-background/80 backdrop-blur-lg border-b border-border h-14 flex items-center px-4 gap-3">
            <SidebarTrigger />
            <div className="flex-1" />
            <Button variant="ghost" size="icon" onClick={signOut}>
              <LogOut className="h-5 w-5" />
            </Button>
          </header>
          <main className="flex-1 p-6 md:p-8">
            {tabContent[activeTab]}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
