'use client';

import { ChainOfThoughtStep } from '@/types';
import { Card } from '@/components/ui/card';
import { Brain, Search, HelpCircle, CheckCircle, Sparkles, Wrench, CheckCheck } from 'lucide-react';
import { motion } from 'framer-motion';

interface ChainOfThoughtProps {
  steps: ChainOfThoughtStep[];
}

const stepIcons = {
  thinking: Brain,
  analyzing: Sparkles,
  querying: Search,
  clarifying: HelpCircle,
  result: CheckCircle,
  tool_call: Wrench,
  tool_result: CheckCheck,
};

const stepColors = {
  thinking: 'bg-blue-500/10 text-blue-600 border-blue-500/20',
  analyzing: 'bg-purple-500/10 text-purple-600 border-purple-500/20',
  querying: 'bg-green-500/10 text-green-600 border-green-500/20',
  clarifying: 'bg-yellow-500/10 text-yellow-600 border-yellow-500/20',
  result: 'bg-emerald-500/10 text-emerald-600 border-emerald-500/20',
  tool_call: 'bg-orange-500/10 text-orange-600 border-orange-500/20',
  tool_result: 'bg-teal-500/10 text-teal-600 border-teal-500/20',
};

export function ChainOfThought({ steps }: ChainOfThoughtProps) {
  if (steps.length === 0) return null;

  return (
    <div className="space-y-1.5">
      <h3 className="text-xs font-semibold text-muted-foreground flex items-center gap-1.5">
        <Brain className="h-3 w-3" />
        Chain of Thought
      </h3>
      <div className="space-y-1.5">
        {steps.map((step, index) => {
          return (
            <motion.div
              key={step.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: index * 0.05 }}
            >
              <Card className={`p-2 border ${stepColors[step.type as keyof typeof stepColors] || stepColors.result}`}>
                <div className="flex items-start gap-2">
                  <div className="mt-0.5">
                    {(() => {
                      const IconComponent = stepIcons[step.type as keyof typeof stepIcons] || stepIcons.result;
                      return <IconComponent className="h-3 w-3" />;
                    })()}
                  </div>
                  <div className="flex-1 space-y-0.5 min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs font-medium capitalize">
                        {step.type}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Step {step.step + 1}
                      </span>
                    </div>
                    <p className="text-xs leading-relaxed">{String(step.content)}</p>
                    {step.data && typeof step.data === 'object' && (
                      <pre className="text-xs bg-black/5 dark:bg-white/5 p-1.5 rounded mt-1 overflow-x-auto">
                        {JSON.stringify(step.data, null, 2)}
                      </pre>
                    )}
                  </div>
                </div>
              </Card>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
}
