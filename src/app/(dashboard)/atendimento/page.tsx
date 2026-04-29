import { CategoryPage } from "@/components/category-page";

export default async function Atendimento({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  return (
    <CategoryPage
      category="atendimento"
      searchParams={sp}
      description="Operação da central telefônica: TMA, TME, disponibilidade, volume e abandono."
    />
  );
}
