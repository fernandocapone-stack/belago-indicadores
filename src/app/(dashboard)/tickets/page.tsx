import { CategoryPage } from "@/components/category-page";

export default async function Tickets({
  searchParams,
}: {
  searchParams: Promise<{ period?: string }>;
}) {
  const sp = await searchParams;
  return (
    <CategoryPage
      category="tickets"
      searchParams={sp}
      description="Volume de tickets abertos, resolvidos e cumprimento de prazo."
    />
  );
}
