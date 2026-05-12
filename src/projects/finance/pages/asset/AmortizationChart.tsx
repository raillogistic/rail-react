import { useMemo } from "react";
import { Area, AreaChart, CartesianGrid, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";
import { Card, CardContent, CardHeader, CardTitle } from "@/shared/ui/kit/card";
import { format, addMonths } from "date-fns";

export interface AmortizationChartProps {
  baseValue: number;
  residualValue: number;
  durationMonths: number;
  startDate: string;
}

export function AmortizationChart({ baseValue, residualValue, durationMonths, startDate }: AmortizationChartProps) {
  const data = useMemo(() => {
    if (!baseValue || !durationMonths || !startDate) return [];
    
    const start = new Date(startDate);
    const result = [];
    const monthlyDepreciation = (baseValue - residualValue) / durationMonths;
    
    for (let i = 0; i <= durationMonths; i++) {
      const currentDate = addMonths(start, i);
      const currentNetValue = Math.max(residualValue, baseValue - (monthlyDepreciation * i));
      
      result.push({
        date: format(currentDate, "MMM yyyy"),
        valeurNette: parseFloat(currentNetValue.toFixed(2)),
      });
      
      // Keep data points manageable (e.g., yearly if duration > 36 months)
      if (durationMonths > 36 && i % 12 !== 0 && i !== durationMonths) {
        result.pop();
      }
    }
    return result;
  }, [baseValue, residualValue, durationMonths, startDate]);

  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Plan d'amortissement</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex h-[300px] items-center justify-center text-muted-foreground">
            Données insuffisantes pour générer le graphique.
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Plan d'amortissement linéaire</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="h-[300px] w-full">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data} margin={{ top: 10, right: 30, left: 0, bottom: 0 }}>
              <defs>
                <linearGradient id="colorValeur" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                  <stop offset="95%" stopColor="#3b82f6" stopOpacity={0}/>
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" opacity={0.3} />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip 
                formatter={(value: number) => [`${value.toLocaleString()} €`, "Valeur Nette"]}
              />
              <Area 
                type="monotone" 
                dataKey="valeurNette" 
                stroke="#3b82f6" 
                fillOpacity={1} 
                fill="url(#colorValeur)" 
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </CardContent>
    </Card>
  );
}
