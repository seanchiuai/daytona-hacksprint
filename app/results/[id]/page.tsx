import { Id } from "@/convex/_generated/dataModel";
import ResultsContent from "./ResultsContent";

export default async function ResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ResultsContent searchResultId={id as Id<"searchResults">} />;
}
