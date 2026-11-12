'use client';

import React from 'react';
import { motion, useReducedMotion } from 'motion/react';
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from '@/components/ui/accordion';
import { FAQ_ITEMS } from './demo-data';

export function FAQ() {
  const shouldReduceMotion = useReducedMotion();

  const getMotionProps = (delay = 0) => ({
    initial: shouldReduceMotion ? { opacity: 1, y: 0 } : { opacity: 0, y: 24 },
    whileInView: { opacity: 1, y: 0 },
    viewport: { once: true, margin: '-60px' },
    transition: {
      duration: shouldReduceMotion ? 0 : 0.7,
      ease: [0.22, 1, 0.36, 1] as [number, number, number, number],
      delay: shouldReduceMotion ? 0 : delay,
    },
  });

  return (
    <section className="sec" aria-labelledby="faq-title">
      <div className="sec-in">
        <motion.span className="lab" {...getMotionProps(0)}>
          FAQ
        </motion.span>

        <motion.h2
          id="faq-title"
          style={{ marginTop: '12px' }}
          {...getMotionProps(0.06)}
        >
          Questions, answered
        </motion.h2>

        <motion.div {...getMotionProps(0.12)}>
          <Accordion type="multiple" className="faq">
            {FAQ_ITEMS.map((item) => (
              <AccordionItem key={item.id} value={item.id}>
                <AccordionTrigger>{item.question}</AccordionTrigger>
                <AccordionContent>
                  <p>
                    {item.emailLink ? (
                      <>
                        Email{' '}
                        <a href={`mailto:${item.emailLink}`}>{item.emailLink}</a>
                        . I read every message.
                      </>
                    ) : (
                      item.answer
                    )}
                  </p>
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </motion.div>
      </div>
    </section>
  );
}
