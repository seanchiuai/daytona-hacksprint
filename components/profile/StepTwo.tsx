"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface FormData {
  major?: string;
  gpa?: number;
  sat?: number;
  act?: number;
}

interface StepTwoProps {
  data: FormData;
  onUpdate: (data: FormData) => void;
  onNext: () => void;
  onBack: () => void;
}

export default function StepTwo({ data, onUpdate, onNext, onBack }: StepTwoProps) {
  const [major, setMajor] = useState(data.major || "");
  const [gpa, setGpa] = useState(data.gpa?.toString() || "");
  const [sat, setSat] = useState(data.sat?.toString() || "");
  const [act, setAct] = useState(data.act?.toString() || "");
  const [errors, setErrors] = useState<{
    major?: string;
    gpa?: string;
    sat?: string;
    act?: string;
  }>({});

  const validate = () => {
    const newErrors: {
      major?: string;
      gpa?: string;
      sat?: string;
      act?: string;
    } = {};

    if (!major || major.trim().length === 0) {
      newErrors.major = "Please enter your intended major";
    }
    if (!gpa || Number(gpa) < 0 || Number(gpa) > 4.0) {
      newErrors.gpa = "Please enter a valid GPA (0.0-4.0)";
    }
    if (sat && (Number(sat) < 400 || Number(sat) > 1600)) {
      newErrors.sat = "SAT score must be between 400-1600";
    }
    if (act && (Number(act) < 1 || Number(act) > 36)) {
      newErrors.act = "ACT score must be between 1-36";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleNext = () => {
    if (validate()) {
      onUpdate({
        major: major.trim(),
        gpa: Number(gpa),
        sat: sat ? Number(sat) : undefined,
        act: act ? Number(act) : undefined,
      });
      onNext();
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-2xl">Academic Information</CardTitle>
        <CardDescription>
          Tell us about your academic background
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="space-y-4">
          <div>
            <Label htmlFor="major">Intended Major</Label>
            <Input
              id="major"
              type="text"
              placeholder="e.g., Computer Science, Engineering, Business"
              value={major}
              onChange={(e) => setMajor(e.target.value)}
              className="mt-1.5"
            />
            {errors.major && (
              <p className="text-sm text-red-600 mt-1">{errors.major}</p>
            )}
          </div>

          <div>
            <Label htmlFor="gpa">GPA</Label>
            <Input
              id="gpa"
              type="number"
              placeholder="e.g., 3.5"
              value={gpa}
              onChange={(e) => setGpa(e.target.value)}
              min="0"
              max="4.0"
              step="0.01"
              className="mt-1.5"
            />
            {errors.gpa && (
              <p className="text-sm text-red-600 mt-1">{errors.gpa}</p>
            )}
            <p className="text-sm text-muted-foreground mt-1">
              On a 4.0 scale
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <Label htmlFor="sat">SAT Score (Optional)</Label>
              <Input
                id="sat"
                type="number"
                placeholder="e.g., 1400"
                value={sat}
                onChange={(e) => setSat(e.target.value)}
                min="400"
                max="1600"
                className="mt-1.5"
              />
              {errors.sat && (
                <p className="text-sm text-red-600 mt-1">{errors.sat}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                400-1600
              </p>
            </div>

            <div>
              <Label htmlFor="act">ACT Score (Optional)</Label>
              <Input
                id="act"
                type="number"
                placeholder="e.g., 32"
                value={act}
                onChange={(e) => setAct(e.target.value)}
                min="1"
                max="36"
                className="mt-1.5"
              />
              {errors.act && (
                <p className="text-sm text-red-600 mt-1">{errors.act}</p>
              )}
              <p className="text-sm text-muted-foreground mt-1">
                1-36
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-3">
          <Button onClick={onBack} variant="outline" className="flex-1">
            Back
          </Button>
          <Button onClick={handleNext} className="flex-1">
            Continue to Preferences
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
