import { Builder } from "@/components/builder/builder";
import { BuilderProvider } from "@/hooks/use-builder";

export default function Home() {
  return (
    <BuilderProvider>
      <main className="flex flex-col h-screen w-full">
        <Builder />
      </main>
    </BuilderProvider>
  );
}
