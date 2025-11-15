"use client";

import { useState, useEffect } from "react";
import { useMutation, useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import StepOne from "./StepOne";
import StepTwo from "./StepTwo";
import StepThree from "./StepThree";
import ProgressIndicator from "./ProgressIndicator";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

interface FormData {
  budget?: number;
  income?: number;
  major?: string;
  gpa?: number;
  sat?: number;
  act?: number;
  states?: string[];
  extracurriculars?: string[];
}

export default function ProfileForm() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [formData, setFormData] = useState<FormData>({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const existingProfile = useQuery(api.studentProfile.getProfile);
  const saveProfile = useMutation(api.studentProfile.saveProfile);

  // Load existing profile data
  useEffect(() => {
    if (existingProfile) {
      setFormData({
        budget: existingProfile.budget,
        income: existingProfile.income,
        major: existingProfile.major,
        gpa: existingProfile.gpa,
        sat: existingProfile.testScores.sat,
        act: existingProfile.testScores.act,
        states: existingProfile.locationPreferences,
        extracurriculars: existingProfile.extracurriculars,
      });
    }
  }, [existingProfile]);

  const updateFormData = (data: Partial<FormData>) => {
    setFormData((prev) => ({ ...prev, ...data }));
  };

  const handleNext = () => {
    setStep((prev) => prev + 1);
  };

  const handleBack = () => {
    setStep((prev) => prev - 1);
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      await saveProfile({
        budget: formData.budget!,
        income: formData.income!,
        major: formData.major!,
        gpa: formData.gpa!,
        testScores: {
          sat: formData.sat,
          act: formData.act,
        },
        locationPreferences: formData.states || [],
        extracurriculars: formData.extracurriculars || [],
      });

      toast.success("Profile saved successfully!");

      // Redirect to home or search page
      router.push("/");
    } catch (error) {
      console.error("Failed to save profile:", error);
      toast.error("Failed to save profile. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-6">
      <ProgressIndicator currentStep={step} totalSteps={3} />

      {step === 1 && (
        <StepOne data={formData} onUpdate={updateFormData} onNext={handleNext} />
      )}

      {step === 2 && (
        <StepTwo
          data={formData}
          onUpdate={updateFormData}
          onNext={handleNext}
          onBack={handleBack}
        />
      )}

      {step === 3 && (
        <StepThree
          data={formData}
          onUpdate={updateFormData}
          onSubmit={handleSubmit}
          onBack={handleBack}
          isSubmitting={isSubmitting}
        />
      )}
    </div>
  );
}
