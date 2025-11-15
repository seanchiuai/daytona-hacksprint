import ProfileForm from "@/components/profile/ProfileForm";

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto">
        <div className="mb-8 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Create Your Student Profile
          </h1>
          <p className="text-muted-foreground mt-2">
            Complete these steps to get personalized college recommendations
          </p>
        </div>
        <ProfileForm />
      </div>
    </div>
  );
}
