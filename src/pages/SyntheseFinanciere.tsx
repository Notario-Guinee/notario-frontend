import { KpiCard } from "@/components/ui/kpi-card";
import { mockRevenueData, formatGNF } from "@/data/mockData";
import { TrendingUp, TrendingDown, Wallet, Receipt } from "lucide-react";
import { LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend } from "recharts";

const pieData = [
  { name: "Espèces", value: 45, color: "hsl(211 55% 48%)" },
  { name: "Virement", value: 25, color: "hsl(200 67% 50%)" },
  { name: "Orange Money", value: 18, color: "hsl(87 52% 49%)" },
  { name: "Chèque", value: 8, color: "hsl(174 58% 40%)" },
  { name: "PayCard", value: 4, color: "hsl(220 24% 64%)" },
];

export default function SyntheseFinanciere() {
  const totalEntrees = mockRevenueData.reduce((s, r) => s + r.revenus, 0);
  const totalSorties = mockRevenueData.reduce((s, r) => s + r.depenses, 0);

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="font-heading text-xl font-bold text-foreground">Synthèse Financière</h1>
        <div className="flex gap-1 rounded-lg bg-muted p-1">
          {["7j", "30j", "3m", "12m"].map((p, i) => (
            <button key={p} className={`rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${i === 3 ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"}`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <KpiCard title="Entrées totales" value={formatGNF(totalEntrees)} trend={14.2} icon={TrendingUp} accentColor="green" />
        <KpiCard title="Sorties totales" value={formatGNF(totalSorties)} trend={-3.1} icon={TrendingDown} accentColor="red" />
        <KpiCard title="Solde net" value={formatGNF(totalEntrees - totalSorties)} trend={18.7} icon={Wallet} accentColor="blue" />
        <KpiCard title="Débours" value={formatGNF(4500000)} icon={Receipt} accentColor="teal" />
      </div>

      <div className="grid grid-cols-1 gap-6 xl:grid-cols-2">
        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Entrées vs Sorties</h2>
          <ResponsiveContainer width="100%" height={280}>
            <LineChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="mois" stroke="hsl(220 24% 64%)" fontSize={11} />
              <YAxis stroke="hsl(220 24% 64%)" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: "hsl(220 30% 13%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px", color: "hsl(225 100% 97%)" }} formatter={(value: number) => [formatGNF(value)]} />
              <Line type="monotone" dataKey="revenus" stroke="hsl(87 52% 49%)" strokeWidth={2.5} dot={false} />
              <Line type="monotone" dataKey="depenses" stroke="hsl(0 72% 51%)" strokeWidth={2} dot={false} />
              <Legend />
            </LineChart>
          </ResponsiveContainer>
        </div>

        <div className="rounded-xl border border-border bg-card p-5 shadow-card">
          <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Revenus par mois</h2>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={mockRevenueData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220 20% 18%)" />
              <XAxis dataKey="mois" stroke="hsl(220 24% 64%)" fontSize={11} />
              <YAxis stroke="hsl(220 24% 64%)" fontSize={11} tickFormatter={(v) => `${(v / 1000000).toFixed(0)}M`} />
              <Tooltip contentStyle={{ background: "hsl(220 30% 13%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px", color: "hsl(225 100% 97%)" }} formatter={(value: number) => [formatGNF(value)]} />
              <Bar dataKey="revenus" fill="hsl(211 55% 48%)" radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="max-w-md rounded-xl border border-border bg-card p-5 shadow-card">
        <h2 className="font-heading text-sm font-semibold text-foreground mb-4">Répartition par mode de paiement</h2>
        <ResponsiveContainer width="100%" height={250}>
          <PieChart>
            <Pie data={pieData} cx="50%" cy="50%" innerRadius={60} outerRadius={90} dataKey="value" paddingAngle={3}>
              {pieData.map((entry) => (
                <Cell key={entry.name} fill={entry.color} />
              ))}
            </Pie>
            <Tooltip contentStyle={{ background: "hsl(220 30% 13%)", border: "1px solid hsl(220 20% 18%)", borderRadius: "12px", color: "hsl(225 100% 97%)" }} />
            <Legend />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
