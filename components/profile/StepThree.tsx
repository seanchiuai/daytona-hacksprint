"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface FormData {
  states?: string[];
  extracurriculars?: string[];
}

interface StepThreeProps {
  data: FormData;
  onUpdate: (data: FormData) => void;
  onSubmit: () => void;
  onBack: () => void;
  isSubmitting: boolean;
}

// Common US state abbreviations
const US_STATES = [
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "FL", "GA",
  "HI", "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD",
  "MA", "MI", "MN", "MS", "MO", "MT", "NE", "NV", "NH", "NJ",
  "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA", "RI", "SC",
  "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY"
];

export default function StepThree({
  data,
  onUpdate,
  onSubmit,
  onBack,
  isSubmitting,
}: StepThreeProps) {
  const [states, setStates] = useState<string[]>(data.states || []);
  const [stateInput, setStateInput] = useState("");
  const [extracurriculars, setExtracurriculars] = useState<string[]>(
    data.extracurriculars || []
  );
  const [extraInput, setExtraInput] = useState("");
  const [errors, setErrors] = useState<{
    states?: string;
    extracurriculars?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      states?: string;
      extracurriculars?: string;
    } = {};

    if (states.length === 0) {
      newErrors.states = "Please select at least one state";
    }
    if (extracurriculars.length > 10) {
      newErrors.extracurriculars = "Maximum 10 extracurriculars allowed";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleAddState = () => {
    const stateCode = stateInput.trim().toUpperCase();
    if (stateCode && US_STATES.includes(stateCode) && !states.includes(stateCode)) {
      setStates([...states, stateCode]);
      setStateInput("");
    }
  };

  const handleRemoveState = (stateToRemove: string) => {
    setStates(states.filter((s) => s !== stateToRemove));
  };

  const handleAddExtra = () => {
    const extra = extraInput.trim();
    if (extra && !extracurriculars.includes(extra) && extracurriculars.length < 10) {
      setExtracurriculars([...extracurriculars, extra]);
      setExtraInput("");
    }
  };

  const handleRemoveExtra = (extraToRemove: string) => {
    setExtracurriculars(extracurriculars.filter((e) => e !== extraToRemove));
  };

  const handleSubmit = () => {
    if (validate()) {
      onUpdate({
        states,
        extracurriculars,
      });
      onSubmit();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Preferences</CardTitle>
        <CardDescription>
          Help us personalize your college recommendations
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="states">Preferred States (2-letter code)</Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="states"
                type="text"
                placeholder="e.g., CA, NY, TX"
                value={stateInput}
                onChange={(e) => setStateInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddState();
                  }
                }}
                maxLength={2}
              />
              <Button type="button" onClick={handleAddState}>
                Add
              </Button>
            </div>
            {errors.states && (
              <p className="text-sm text-red-600 mt-1">{errors.states}</p>
            )}
            <div className="flex flex-wrap gap-2 mt-3">
              {states.map((state) => (
                <Badge key={state} variant="secondary" className="px-3 py-1">
                  {state}
                  <button
                    type="button"
                    onClick={() => handleRemoveState(state)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>

          <div>
            <Label htmlFor="extracurriculars">
              Extracurriculars & Interests (Optional)
            </Label>
            <div className="flex gap-2 mt-1.5">
              <Input
                id="extracurriculars"
                type="text"
                placeholder="e.g., Soccer, Debate, Coding"
                value={extraInput}
                onChange={(e) => setExtraInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === "Enter") {
                    e.preventDefault();
                    handleAddExtra();
                  }
                }}
              />
              <Button
                type="button"
                onClick={handleAddExtra}
                disabled={extracurriculars.length >= 10}
              >
                Add
              </Button>
            </div>
            {errors.extracurriculars && (
              <p className="text-sm text-red-600 mt-1">
                {errors.extracurriculars}
              </p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              Maximum 10 items
            </p>
            <div className="flex flex-wrap gap-2 mt-3">
              {extracurriculars.map((extra) => (
                <Badge key={extra} variant="secondary" className="px-3 py-1">
                  {extra}
                  <button
                    type="button"
                    onClick={() => handleRemoveExtra(extra)}
                    className="ml-2 hover:text-destructive"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </Badge>
              ))}
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button
            onClick={handleSubmit}
            disabled={isSubmitting}
            className="flex-1"
          >
            {isSubmitting ? "Saving..." : "Complete Profile"}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
