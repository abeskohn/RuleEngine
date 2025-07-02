import { useState } from "react";

export interface Rule {
  id: number;
  columnNames: string[];
  ruleName: string;
}

export const useRules = () => {
  const [rules, setRules] = useState<Rule[]>([]);

  const addRule = (columnNames: string[], ruleName: string) => {
    setRules([...rules, { id: Date.now(), columnNames, ruleName }]);
  };

  const deleteRule = (id: number) => {
    setRules(rules.filter((rule) => rule.id !== id));
  };

  return { rules, addRule, deleteRule };
};
