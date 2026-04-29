import { CategoryPage } from "@/components/category-page";

export default async function Niveis({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  return (
    <CategoryPage
      category="niveis"
      searchParams={sp}
      description="Distribuição de tickets resolvidos por nível (N1, N2, N3, Área de Negócio)."
    />
  );
}
