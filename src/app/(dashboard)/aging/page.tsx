import { CategoryPage } from "@/components/category-page";

export default async function Aging({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  return (
    <CategoryPage
      category="aging"
      searchParams={sp}
      description="Tempo de resolução dos tickets — quantos foram resolvidos em 1, 2, 3, 4, 5 dias e mais de 5."
    />
  );
}
