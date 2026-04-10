import { Link } from "react-router";
import BackgroundGrid from "../../components/common/BackgroundGrid";

export default function NotFound() {
  return (
    <div className="flex flex-col items-center justify-center pt-24 text-sm max-md:px-4 relative">
      <BackgroundGrid />
      <h1 className="text-8xl md:text-9xl font-bold text-indigo-500">404</h1>
      <div className="h-1 w-16 rounded bg-indigo-500 my-5 md:my-7"></div>
      <p className="text-2xl md:text-3xl font-bold text-[var(--color-text)] ">
        Page Not Found
      </p>
      <p className="text-sm md:text-base  mt-4 text-[var(--color-gray)] max-w-md text-center">
        The page you are looking for might have been removed, had its name
        changed, or is temporarily unavailable.
      </p>
      <div className="flex items-center gap-4 mt-6">
        <Link
          to="/"
          className="bg-[var(--color-text)] px-7 py-2.5 text-[var(--color-bg)] rounded-md active:scale-95 transition-all"
        >
          Return Home
        </Link>
      </div>
    </div>
  );
}
