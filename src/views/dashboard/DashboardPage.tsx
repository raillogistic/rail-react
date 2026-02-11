import React from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/lib/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/lib/components/ui/tabs";
import { Button } from "@/lib/components/ui/button";
import {
  TrendingUp,
  TrendingDown,
  Users,
  Package,
  Activity,
  Calendar,
  Filter,
  Download,
  Zap,
  ShieldCheck,
  Globe,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
} from "recharts";
import { cn } from "@/lib/utils";
import { IconArrowRight } from "@tabler/icons-react";

const data = [
  { name: "Jan", revenue: 4500, orders: 240 },
  { name: "Feb", revenue: 5200, orders: 300 },
  { name: "Mar", revenue: 4800, orders: 280 },
  { name: "Apr", revenue: 6100, orders: 390 },
  { name: "May", revenue: 5900, orders: 350 },
  { name: "Jun", revenue: 7200, orders: 480 },
  { name: "Jul", revenue: 8100, orders: 520 },
];

const statusData = [
  { name: "Livré", value: 400, color: "#10b981" },
  { name: "En cours", value: 300, color: "#3b82f6" },
  { name: "En attente", value: 200, color: "#f59e0b" },
  { name: "Annulé", value: 100, color: "#ef4444" },
];

const recentActivity = [
  {
    id: 1,
    user: "Jean Dupont",
    action: "a créé une nouvelle commande",
    time: "Il y a 2 min",
    status: "success",
  },
  {
    id: 2,
    user: "Marie Curie",
    action: "a mis à jour son profil",
    time: "Il y a 15 min",
    status: "info",
  },
  {
    id: 3,
    user: "Système",
    action: "Sauvegarde hebdomadaire terminée",
    time: "Il y a 1h",
    status: "warning",
  },
  {
    id: 4,
    user: "Marc Bloch",
    action: "a supprimé un produit",
    time: "Il y a 3h",
    status: "error",
  },
];

export function DashboardPage() {
  return (
    <div className="flex-1 space-y-8 p-2 pt-0">
      <div className="flex items-center justify-between space-y-2">
        <div>
          <h2 className="text-3xl font-black tracking-tight text-foreground">
            Tableau de Bord
          </h2>
          <p className="text-muted-foreground font-medium">
            Bienvenue, voici un aperçu de vos activités aujourd'hui.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-9 rounded-xl border-border/40 bg-background/50 backdrop-blur-sm"
          >
            <Calendar className="mr-2 h-4 w-4" />
            Jan 2026 - Fév 2026
          </Button>
          <Button
            size="sm"
            className="h-9 rounded-xl shadow-lg shadow-primary/20"
          >
            <Download className="mr-2 h-4 w-4" />
            Exporter
          </Button>
        </div>
      </div>

      <Tabs defaultValue="overview" className="space-y-6">
        <div className="flex items-center justify-between">
          <TabsList className="bg-muted/50 p-1 rounded-2xl h-11 border border-border/20 backdrop-blur-sm">
            <TabsTrigger
              value="overview"
              className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Vue d'ensemble
            </TabsTrigger>
            <TabsTrigger
              value="analytics"
              className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Analytique
            </TabsTrigger>
            <TabsTrigger
              value="reports"
              className="rounded-xl px-6 text-xs font-bold uppercase tracking-widest data-[state=active]:bg-background data-[state=active]:shadow-sm"
            >
              Rapports
            </TabsTrigger>
          </TabsList>

          <div className="hidden md:flex items-center gap-2">
            <div className="flex -space-x-2 mr-4">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="h-8 w-8 rounded-full border-2 border-background bg-muted flex items-center justify-center text-[10px] font-bold"
                >
                  U{i}
                </div>
              ))}
              <div className="h-8 w-8 rounded-full border-2 border-background bg-primary/10 text-primary flex items-center justify-center text-[10px] font-bold">
                +5
              </div>
            </div>
            <Button variant="ghost" size="icon" className="h-9 w-9 rounded-xl">
              <Filter className="h-4 w-4" />
            </Button>
          </div>
        </div>

        <TabsContent
          value="overview"
          className="space-y-6 animate-in fade-in duration-500"
        >
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <StatsCard
              title="Chiffre d'Affaires"
              value="45,231.89 €"
              description="+20.1% par rapport au mois dernier"
              icon={<TrendingUp className="h-4 w-4 text-emerald-500" />}
              trend="up"
            />
            <StatsCard
              title="Commandes"
              value="+2350"
              description="+180.1% par rapport au mois dernier"
              icon={<Package className="h-4 w-4 text-blue-500" />}
              trend="up"
            />
            <StatsCard
              title="Utilisateurs Actifs"
              value="+12,234"
              description="+19% par rapport au mois dernier"
              icon={<Users className="h-4 w-4 text-purple-500" />}
              trend="up"
            />
            <StatsCard
              title="Taux de Rebond"
              value="24.5%"
              description="-4% par rapport au mois dernier"
              icon={<TrendingDown className="h-4 w-4 text-orange-500" />}
              trend="down"
            />
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-7">
            <Card className="lg:col-span-4 rounded-[2rem] border-border/40 shadow-xl shadow-shadow/5 overflow-hidden group">
              <CardHeader className="flex flex-row items-center justify-between pb-8">
                <div className="space-y-1">
                  <CardTitle className="text-xl font-black tracking-tight">
                    Performance des Ventes
                  </CardTitle>
                  <CardDescription className="font-medium">
                    Évolution du chiffre d'affaires sur les 7 derniers mois
                  </CardDescription>
                </div>
                <div className="flex items-center gap-2">
                  <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary/10 text-primary text-[10px] font-black uppercase tracking-widest">
                    <Zap className="size-3" /> Croissance
                  </div>
                </div>
              </CardHeader>
              <CardContent className="px-2">
                <div className="h-[350px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={data}>
                      <defs>
                        <linearGradient
                          id="colorRevenue"
                          x1="0"
                          y1="0"
                          x2="0"
                          y2="1"
                        >
                          <stop
                            offset="5%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0.3}
                          />
                          <stop
                            offset="95%"
                            stopColor="hsl(var(--primary))"
                            stopOpacity={0}
                          />
                        </linearGradient>
                      </defs>
                      <CartesianGrid
                        strokeDasharray="3 3"
                        vertical={false}
                        stroke="hsl(var(--muted))"
                        opacity={0.4}
                      />
                      <XAxis
                        dataKey="name"
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        dy={10}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{
                          fill: "hsl(var(--muted-foreground))",
                          fontSize: 12,
                          fontWeight: 600,
                        }}
                        tickFormatter={(value) => `${value}€`}
                      />
                      <Tooltip
                        contentStyle={{
                          backgroundColor: "hsl(var(--background))",
                          borderColor: "hsl(var(--border))",
                          borderRadius: "16px",
                          boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)",
                          fontSize: "12px",
                          fontWeight: "bold",
                        }}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="hsl(var(--primary))"
                        strokeWidth={4}
                        fillOpacity={1}
                        fill="url(#colorRevenue)"
                        animationDuration={2000}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card className="lg:col-span-3 rounded-[2rem] border-border/40 shadow-xl shadow-shadow/5 flex flex-col">
              <CardHeader>
                <CardTitle className="text-xl font-black tracking-tight">
                  Activité Récente
                </CardTitle>
                <CardDescription className="font-medium">
                  Les dernières actions sur la plateforme
                </CardDescription>
              </CardHeader>
              <CardContent className="flex-1">
                <div className="space-y-6">
                  {recentActivity.map((item) => (
                    <div
                      key={item.id}
                      className="flex items-start gap-4 group/item cursor-pointer"
                    >
                      <div
                        className={cn(
                          "mt-1 h-10 w-10 shrink-0 rounded-xl flex items-center justify-center transition-all duration-300 group-hover/item:scale-110",
                          item.status === "success"
                            ? "bg-emerald-500/10 text-emerald-600"
                            : item.status === "info"
                              ? "bg-blue-500/10 text-blue-600"
                              : item.status === "warning"
                                ? "bg-orange-500/10 text-orange-600"
                                : "bg-red-500/10 text-red-600",
                        )}
                      >
                        <Activity className="size-5" />
                      </div>
                      <div className="flex-1 min-w-0 space-y-0.5">
                        <p className="text-sm font-bold text-foreground leading-none">
                          {item.user}
                        </p>
                        <p className="text-xs text-muted-foreground font-medium truncate">
                          {item.action}
                        </p>
                        <p className="text-[10px] text-muted-foreground/50 font-bold uppercase tracking-wider pt-1">
                          {item.time}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 rounded-full opacity-0 group-hover/item:opacity-100 transition-opacity"
                      >
                        <IconArrowRight className="size-4" />
                      </Button>
                    </div>
                  ))}
                </div>
                <Button
                  variant="outline"
                  className="w-full mt-8 rounded-xl border-border/40 font-bold text-xs uppercase tracking-widest h-11 hover:bg-primary/5 hover:text-primary transition-all"
                >
                  Voir tout l'historique
                </Button>
              </CardContent>
            </Card>
          </div>

          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            <Card className="rounded-[2rem] border-border/40 bg-[#0a0a0b] text-white overflow-hidden relative group">
              <div className="absolute inset-0 bg-primary/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <div className="absolute -right-12 -bottom-12 size-48 bg-primary/20 rounded-full blur-[60px]" />
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-white/10 flex items-center justify-center mb-4">
                  <ShieldCheck className="size-6 text-primary" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                  Sécurité Système
                </CardTitle>
                <CardDescription className="text-white/50 font-medium tracking-tight">
                  Tout est sous contrôle. 12 menaces bloquées cette semaine.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mt-4 p-4 rounded-2xl bg-white/5 border border-white/10 backdrop-blur-sm">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-[10px] font-black uppercase tracking-widest text-white/40">
                      Intégrité
                    </span>
                    <span className="text-xs font-black text-emerald-400">
                      99.9%
                    </span>
                  </div>
                  <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-[99.9%]" />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/40 bg-primary text-primary-foreground overflow-hidden relative group">
              <div className="absolute inset-0 bg-black/10 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
              <CardHeader>
                <div className="h-12 w-12 rounded-2xl bg-white/20 flex items-center justify-center mb-4">
                  <Globe className="size-6" />
                </div>
                <CardTitle className="text-2xl font-black tracking-tight">
                  Expansion Réseau
                </CardTitle>
                <CardDescription className="text-white/70 font-medium tracking-tight">
                  Nouveaux serveurs déployés en Asie du Sud-Est.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Button
                  variant="secondary"
                  className="w-full rounded-xl font-bold bg-white text-primary hover:bg-white/90"
                >
                  Explorer la carte
                </Button>
              </CardContent>
            </Card>

            <Card className="rounded-[2rem] border-border/40 shadow-xl shadow-shadow/5">
              <CardHeader>
                <CardTitle className="text-xl font-black tracking-tight">
                  Répartition Commandes
                </CardTitle>
              </CardHeader>
              <CardContent className="flex justify-center">
                <div className="h-[200px] w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={statusData}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {statusData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

interface StatsCardProps {
  title: string;
  value: string;
  description: string;
  icon: React.ReactNode;
  trend: "up" | "down";
}

function StatsCard({ title, value, description, icon, trend }: StatsCardProps) {
  return (
    <Card className="rounded-[2rem] border-border/40 shadow-xl shadow-shadow/5 group hover:border-primary/20 transition-all duration-300 hover:-translate-y-1">
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground/60 group-hover:text-primary transition-colors">
          {title}
        </CardTitle>
        <div className="h-8 w-8 rounded-xl bg-muted/50 flex items-center justify-center group-hover:bg-primary/10 transition-colors">
          {icon}
        </div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-black tracking-tighter">{value}</div>
        <p className="text-[10px] font-bold pt-1 flex items-center gap-1">
          <span
            className={cn(
              trend === "up" ? "text-emerald-500" : "text-orange-500",
            )}
          >
            {description.split(" ")[0]}
          </span>
          <span className="text-muted-foreground/50">
            {description.split(" ").slice(1).join(" ")}
          </span>
        </p>
      </CardContent>
    </Card>
  );
}
