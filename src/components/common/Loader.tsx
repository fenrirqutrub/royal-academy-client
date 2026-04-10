import { Loader2 } from "lucide-react";

const Loader = () => {
  return (
    <div className="flex flex-col items-center justify-center gap-3 py-16">
      <div className="relative">
        <Loader2 className="absolute inset-0 w-10 h-10 animate-spin text-[var(--color-active-text)]" />
      </div>
    </div>
  );
};

export default Loader;
