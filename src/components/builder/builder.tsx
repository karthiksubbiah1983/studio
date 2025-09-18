import { Header } from "./header";
import { ElementsSidebar } from "./elements-sidebar";
import { PropertiesSidebar } from "./properties-sidebar";
import { Canvas } from "./canvas";

export function Builder() {
  return (
    <div className="flex flex-col w-full h-full">
      <Header />
      <div className="flex flex-grow h-full overflow-hidden">
        <ElementsSidebar />
        <div className="flex-grow h-full overflow-y-auto bg-background">
          <Canvas />
        </div>
        <PropertiesSidebar />
      </div>
    </div>
  );
}
