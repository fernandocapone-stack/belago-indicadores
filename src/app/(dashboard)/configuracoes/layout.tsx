export default function ConfiguracoesLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex justify-center">
      <div className="w-full max-w-xl space-y-6">{children}</div>
    </div>
  );
}
