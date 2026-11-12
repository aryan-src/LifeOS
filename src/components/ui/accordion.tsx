'use client';

import * as React from 'react';
import { cn } from '@/lib/utils';

interface AccordionContextValue {
  type: 'single' | 'multiple';
  collapsible?: boolean;
  value: string[];
  onItemToggle: (value: string) => void;
}

const AccordionContext = React.createContext<AccordionContextValue | null>(null);

export interface AccordionProps extends React.HTMLAttributes<HTMLDivElement> {
  type?: 'single' | 'multiple';
  collapsible?: boolean;
  defaultValue?: string | string[];
  value?: string | string[];
  onValueChange?: (value: string | string[]) => void;
}

export function Accordion({
  type = 'multiple',
  collapsible = true,
  defaultValue,
  value: controlledValue,
  onValueChange,
  className,
  children,
  ...props
}: AccordionProps) {
  const [internalValue, setInternalValue] = React.useState<string[]>(() => {
    if (defaultValue) {
      return Array.isArray(defaultValue) ? defaultValue : [defaultValue];
    }
    return [];
  });

  const value = React.useMemo(() => {
    if (controlledValue !== undefined) {
      return Array.isArray(controlledValue) ? controlledValue : [controlledValue];
    }
    return internalValue;
  }, [controlledValue, internalValue]);

  const onItemToggle = React.useCallback(
    (itemValue: string) => {
      let newValue: string[];
      const isOpen = value.includes(itemValue);

      if (type === 'single') {
        if (isOpen) {
          newValue = collapsible ? [] : [itemValue];
        } else {
          newValue = [itemValue];
        }
      } else {
        if (isOpen) {
          newValue = value.filter((v) => v !== itemValue);
        } else {
          newValue = [...value, itemValue];
        }
      }

      if (controlledValue === undefined) {
        setInternalValue(newValue);
      }
      onValueChange?.(type === 'single' ? newValue[0] || '' : newValue);
    },
    [value, type, collapsible, controlledValue, onValueChange]
  );

  return (
    <AccordionContext.Provider value={{ type, collapsible, value, onItemToggle }}>
      <div className={cn('faq', className)} {...props}>
        {children}
      </div>
    </AccordionContext.Provider>
  );
}

interface AccordionItemContextValue {
  value: string;
  isOpen: boolean;
  id: string;
}

const AccordionItemContext = React.createContext<AccordionItemContextValue | null>(null);

export interface AccordionItemProps extends React.HTMLAttributes<HTMLDivElement> {
  value: string;
}

export const AccordionItem = React.forwardRef<HTMLDivElement, AccordionItemProps>(
  ({ value, className, children, ...props }, ref) => {
    const accordion = React.useContext(AccordionContext);
    const id = React.useId();
    const isOpen = accordion?.value.includes(value) ?? false;

    return (
      <AccordionItemContext.Provider value={{ value, isOpen, id }}>
        <div
          ref={ref}
          data-state={isOpen ? 'open' : 'closed'}
          className={cn('border-t border-[var(--line)] last:border-b', className)}
          {...props}
        >
          {children}
        </div>
      </AccordionItemContext.Provider>
    );
  }
);
AccordionItem.displayName = 'AccordionItem';

export interface AccordionTriggerProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
}

export const AccordionTrigger = React.forwardRef<HTMLButtonElement, AccordionTriggerProps>(
  ({ className, children, ...props }, ref) => {
    const accordion = React.useContext(AccordionContext);
    const item = React.useContext(AccordionItemContext);

    if (!item) {
      throw new Error('AccordionTrigger must be used within an AccordionItem');
    }

    const handleClick = () => {
      accordion?.onItemToggle(item.value);
    };

    return (
      <h3 className="m-0 flex">
        <button
          ref={ref}
          type="button"
          id={`accordion-trigger-${item.id}`}
          aria-controls={`accordion-content-${item.id}`}
          aria-expanded={item.isOpen}
          data-state={item.isOpen ? 'open' : 'closed'}
          onClick={handleClick}
          className={cn(
            'flex flex-1 items-center justify-between gap-4 py-6 text-left text-lg font-semibold leading-7 text-[var(--ink)] transition-colors hover:text-[var(--accent)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)] focus-visible:ring-offset-2 cursor-pointer group',
            className
          )}
          {...props}
        >
          <span>{children}</span>
          <span
            aria-hidden="true"
            className="flex-none text-2xl font-normal leading-7 text-[var(--accent)] transition-transform duration-300 group-data-[state=open]:rotate-45"
          >
            +
          </span>
        </button>
      </h3>
    );
  }
);
AccordionTrigger.displayName = 'AccordionTrigger';

export interface AccordionContentProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
}

export const AccordionContent = React.forwardRef<HTMLDivElement, AccordionContentProps>(
  ({ className, children, ...props }, ref) => {
    const item = React.useContext(AccordionItemContext);

    if (!item) {
      throw new Error('AccordionContent must be used within an AccordionItem');
    }

    return (
      <div
        ref={ref}
        id={`accordion-content-${item.id}`}
        aria-labelledby={`accordion-trigger-${item.id}`}
        role="region"
        data-state={item.isOpen ? 'open' : 'closed'}
        hidden={!item.isOpen}
        className={cn(
          'overflow-hidden pb-6 text-base leading-6 text-[var(--ink-2)] max-w-[680px]',
          !item.isOpen && 'hidden',
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
AccordionContent.displayName = 'AccordionContent';
