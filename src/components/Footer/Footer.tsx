import { Link } from "react-router";
import Border from "../common/Border";

const Footer = () => (
  <div>
    <Border />
    <div className="md:mx-10 pb-24 md:pb-10 flex flex-col sm:flex-row items-center justify-between gap-3 text-[var(--color-active-border)]">
      <p className="text-base">
        &copy; ২০২৪ হতে সর্বস্বত্ব সংরক্ষিত — রয়েল একাডেমি, বেলকুচি
      </p>
      <p className="text-base">
        Developed by{" "}
        <Link
          to="https://masudibnbelat.vercel.app"
          target="_blank"
          className="font-extrabold rubik underline  "
        >
          Masud Ibn Belat
        </Link>
      </p>
    </div>
  </div>
);

export default Footer;
