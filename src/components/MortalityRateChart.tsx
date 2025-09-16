import React, { useRef, useEffect, useState } from 'react';
import ChartJS, { Chart } from 'chart.js/auto';
import { supabase } from '@/integrations/supabase/client';

const MortalityRateChart: React.FC = () => {
  const chartRef = useRef<HTMLCanvasElement | null>(null);
  const chartInstance = useRef<Chart | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const userId = session?.user?.id;
        if (!userId) return;

        const since = new Date();
        since.setDate(since.getDate() - 30);

        const { data, error } = await supabase
          .from('daily_logs')
          .select('log_date, alive_count, dead_count')
          .eq('user_id', userId)
          .gte('log_date', since.toISOString().slice(0,10))
          .order('log_date', { ascending: true });
        if (error) throw error;

        const byDate: Record<string, { alive: number; dead: number }> = {};
        (data || []).forEach((r) => {
          const d = r.log_date;
          if (!byDate[d]) byDate[d] = { alive: 0, dead: 0 };
          byDate[d].alive += r.alive_count || 0;
          byDate[d].dead += r.dead_count || 0;
        });

        const labels = Object.keys(byDate).sort();
        const mortality = labels.map((d) => {
          const { alive, dead } = byDate[d];
          const denom = alive + dead;
          return denom > 0 ? Math.round((dead / denom) * 1000) / 10 : 0;
        });

        if (chartRef.current) {
          if (chartInstance.current) chartInstance.current.destroy();
          const ctx = chartRef.current.getContext('2d');
          if (!ctx) return;
          chartInstance.current = new Chart(ctx, {
            type: 'line',
            data: {
              labels,
              datasets: [{
                label: 'Daily Mortality Rate (%)',
                data: mortality,
                backgroundColor: 'rgba(239, 68, 68, 0.2)',
                borderColor: 'rgba(239, 68, 68, 1)',
                borderWidth: 2,
                tension: 0.3,
                fill: true
              }]
            },
            options: {
              responsive: true,
              maintainAspectRatio: false,
              scales: {
                y: {
                  beginAtZero: true,
                  title: { display: true, text: 'Percentage (%)' }
                },
                x: {
                  title: { display: true, text: 'Date' }
                }
              }
            }
          });
        }
      } finally {
        setIsLoading(false);
      }
    };

    load();

    return () => {
      if (chartInstance.current) chartInstance.current.destroy();
    };
  }, []);

  return (
    <div className="h-64">
      <canvas ref={chartRef} />
    </div>
  );
};

export default MortalityRateChart;


