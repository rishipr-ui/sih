import React, { useEffect, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Chart } from 'chart.js/auto';

const ProductionChart: React.FC = () => {
  const ref = useRef<HTMLCanvasElement | null>(null);
  const instance = useRef<Chart | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const userId = session?.user?.id;
      if (!userId) return;

      const since = new Date();
      since.setDate(since.getDate() - 30);

      const { data: logs, error } = await supabase
        .from('daily_logs')
        .select('log_date, eggs_count, offspring_count')
        .eq('user_id', userId)
        .gte('log_date', since.toISOString().slice(0,10))
        .order('log_date', { ascending: true });
      if (error) return;

      const byDate: Record<string, { eggs: number; offspring: number }> = {};
      (logs || []).forEach((r) => {
        const d = r.log_date;
        if (!byDate[d]) byDate[d] = { eggs: 0, offspring: 0 };
        byDate[d].eggs += r.eggs_count || 0;
        byDate[d].offspring += r.offspring_count || 0;
      });

      const labels = Object.keys(byDate).sort();
      const eggs = labels.map((d) => byDate[d].eggs);
      const offspring = labels.map((d) => byDate[d].offspring);

      if (ref.current) {
        if (instance.current) instance.current.destroy();
        const ctx = ref.current.getContext('2d');
        if (!ctx) return;
        instance.current = new Chart(ctx, {
          type: 'bar',
          data: {
            labels,
            datasets: [
              {
                type: 'bar',
                label: 'Eggs',
                data: eggs,
                backgroundColor: 'rgba(59, 130, 246, 0.6)',
                borderColor: 'rgba(59, 130, 246, 1)'
              },
              {
                type: 'line',
                label: 'Offspring',
                data: offspring,
                borderColor: 'rgba(16, 185, 129, 1)',
                backgroundColor: 'rgba(16, 185, 129, 0.2)',
                tension: 0.3,
                fill: true
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              y: { beginAtZero: true },
              x: { title: { display: true, text: 'Date' } }
            }
          }
        });
      }
    };

    load();
    return () => { if (instance.current) instance.current.destroy(); };
  }, []);

  return (
    <div className="h-64">
      <canvas ref={ref} />
    </div>
  );
};

export default ProductionChart;


