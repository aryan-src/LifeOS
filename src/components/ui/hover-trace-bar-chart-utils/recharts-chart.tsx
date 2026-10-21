'use client';

import * as React from 'react';
import * as RechartsPrimitive from 'recharts';
import { cn } from '@/lib/utils';

export type ChartConfig = {
  [k in string]: {
    label?: React.ReactNode;
    icon?: React.ComponentType;
    color?: string;
    theme?: Record<string, string>;
    colors?: {
      light?: string[];
      dark?: string[];
    };
  };
};

type ChartContextProps = {
  config: ChartConfig;
};

const ChartContext = React.createContext<ChartContextProps | null>(null);

export function useChart() {
  const context = React.useContext(ChartContext);
  if (!context) {
    throw new Error('useChart must be used within a <ChartContainer />');
  }
  return context;
}

const ChartStyle = ({ id, config }: { id: string; config: ChartConfig }) => {
  const colorEntries = Object.entries(config);
  if (!colorEntries.length) return null;

  const styleRules = colorEntries
    .map(([key, itemConfig]) => {
      const rules: string[] = [];
      if (itemConfig.color) {
        rules.push(`[data-chart="${id}"] { --color-${key}: ${itemConfig.color}; }`);
      }
      if (itemConfig.colors?.light) {
        itemConfig.colors.light.forEach((colorVal, idx) => {
          rules.push(`[data-chart="${id}"] { --color-${key}-${idx}: ${colorVal}; }`);
        });
      }
      if (itemConfig.colors?.dark) {
        itemConfig.colors.dark.forEach((colorVal, idx) => {
          rules.push(`.dark [data-chart="${id}"] { --color-${key}-${idx}: ${colorVal}; }`);
        });
      }
      if (itemConfig.theme) {
        Object.entries(itemConfig.theme).forEach(([themeKey, colorVal]) => {
          if (themeKey === 'dark') {
            rules.push(`.dark [data-chart="${id}"] { --color-${key}: ${colorVal}; }`);
          } else {
            rules.push(`[data-chart="${id}"] { --color-${key}: ${colorVal}; }`);
          }
        });
      }
      return rules.join('\n');
    })
    .join('\n');

  return (
    <style
      dangerouslySetInnerHTML={{
        __html: styleRules,
      }}
    />
  );
};

export const ChartContainer = React.forwardRef<
  HTMLDivElement,
  React.ComponentProps<'div'> & {
    config: ChartConfig;
    children: React.ComponentProps<
      typeof RechartsPrimitive.ResponsiveContainer
    >['children'];
  }
>(({ id, className, children, config, ...props }, ref) => {
  const uniqueId = React.useId();
  const chartId = `chart-${id || uniqueId.replace(/:/g, '')}`;

  return (
    <ChartContext.Provider value={{ config }}>
      <div
        data-chart={chartId}
        ref={ref}
        className={cn(
          'flex aspect-video justify-center text-xs [&_.recharts-cartesian-axis-tick_text]:fill-muted-foreground [&_.recharts-cartesian-grid_line[stroke="#ccc"]]:stroke-border/50 [&_.recharts-curve.recharts-tooltip-cursor]:stroke-border [&_.recharts-dot[stroke="#fff"]]:stroke-transparent [&_.recharts-layer]:outline-none [&_.recharts-polar-grid_[stroke="#ccc"]]:stroke-border [&_.recharts-radial-bar-background-sector]:fill-muted [&_.recharts-rectangle.recharts-tooltip-cursor]:fill-muted [&_.recharts-reference-line_[stroke="#ccc"]]:stroke-border [&_.recharts-sector[stroke="#fff"]]:stroke-transparent [&_.recharts-sector]:outline-none [&_.recharts-surface]:outline-none',
          className
        )}
        {...props}
      >
        <ChartStyle id={chartId} config={config} />
        <RechartsPrimitive.ResponsiveContainer width="100%" height="100%">
          {children}
        </RechartsPrimitive.ResponsiveContainer>
      </div>
    </ChartContext.Provider>
  );
});
ChartContainer.displayName = 'ChartContainer';

export default ChartContainer;
