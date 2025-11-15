"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormData {
  budget?: number;
  income?: number;
}

interface StepOneProps {
  data: FormData;
  onUpdate: (data: FormData) => void;
  onNext: () => void;
}

export default function StepOne({ data, onUpdate, onNext }: StepOneProps) {
  const [budget, setBudget] = useState(data.budget?.toString() || "");
  const [income, setIncome] = useState(data.income?.toString() || "");
  const [errors, setErrors] = useState<{ budget?: string; income?: string }>({});

  const validate = () => {
    const newErrors: { budget?: string; income?: string } = {};

    if (!budget || Number(budget) <= 0) {
      newErrors.budget = "Please enter a valid budget";
    }
    if (!income || Number(income) < 0) {
      newErrors.income = "Please enter a valid income";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate({
        budget: Number(budget),
        income: Number(income),
      });
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Financial Information</CardTitle>
        <CardDescription>
          Help us find colleges within your budget
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="budget">
              Maximum Annual Budget (Tuition + Fees)
            </Label>
            <Input
              id="budget"
              type="number"
              placeholder="e.g., 30000"
              value={budget}
              onChange={(e) => setBudget(e.target.value)}
              min="0"
              step="1000"
              className="mt-1.5"
            />
            {errors.budget && (
              <p className="text-sm text-red-600 mt-1">{errors.budget}</p>
            )}
          </div>

          <div>
            <Label htmlFor="income">Annual Family Income</Label>
            <Input
              id="income"
              type="number"
              placeholder="e.g., 75000"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              min="0"
              step="1000"
              className="mt-1.5"
            />
            {errors.income && (
              <p className="text-sm text-red-600 mt-1">{errors.income}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Used to estimate financial aid eligibility
            </p>
          </div>
        </div>

        <Button onClick={handleNext} className="w-full">
          Continue to Academic Info
        </Button>
      </CardContent>
    </Card>
  );
}
