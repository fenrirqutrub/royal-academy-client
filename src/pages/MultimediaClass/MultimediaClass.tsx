import { Link } from "react-router";

const MultimediaClass = () => {
  return (
    <div className="h-screen">
      <h2 className="text-center"> শ্রেণিঃ ৮ম </h2>

      <Link
        to="/class-8/bgm"
        className="border border-[var(--color-active-border)] px-3 py-1"
      >
        বাংলাদেশ ও বিশ্বপরিচয়{" "}
      </Link>
    </div>
  );
};

export default MultimediaClass;
