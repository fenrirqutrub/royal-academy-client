import { motion, useInView } from "framer-motion";
import { useRef, memo } from "react";
import Social, { PHONE_NUMBERS } from "./Social";
import { IoLocationSharp } from "react-icons/io5";
import { MdPhoneIphone } from "react-icons/md";
import Border from "../common/Border";

interface FadeUpProps {
  children: React.ReactNode;
  delay?: number;
}

const FadeUp = memo(({ children, delay = 0 }: FadeUpProps) => {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-50px" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 28 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.65, delay, ease: [0.22, 1, 0.36, 1] }}
    >
      {children}
    </motion.div>
  );
});
FadeUp.displayName = "FadeUp";

const Contact = () => (
  <footer className="bangla relative overflow-hidden  bg-[var(--color-bg)] text-[var(--color-text)] ">
    <Border />

    <div className="relative z-10 w-full px-3 md:px-0 mx-auto text-[var(--color-gray)]">
      <FadeUp>
        <div className=" flex flex-col items-center justify-center gap-4">
          <header className="text-center ">
            <h1 className="text-2xl md:text-4xl font-bold">
              রয়েল একাডেমি, বেলকুচি
            </h1>
          </header>
          <section className="">
            <div className="flex flex-col items-center  ">
              <p className="text-center sm:text-right text-lg md:text-xl font-bold ">
                যোগাযোগ
              </p>
              <p className="text-md md:text-lg  my-3 flex gap-x-2 items-center">
                <IoLocationSharp className="text-lg flex-shrink-0" />
                মুকুন্দগাতী বাজার, বেলকুচি, সিরাজগঞ্জ
              </p>

              {/* Phone numbers */}
              <div className="flex justify-start items-center gap-2 mt-1">
                <MdPhoneIphone className="text-md md:text-lg flex-shrink-0 " />
                <div className="flex flex-row flex-wrap justify-center sm:justify-end gap-x-3">
                  {PHONE_NUMBERS.map(({ display, tel }, i) => (
                    <motion.a
                      key={tel}
                      href={`tel:+88${tel}`}
                      initial={{ opacity: 0, x: 8 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: 0.35 + i * 0.1 }}
                      whileHover={{ x: -4 }}
                      className="text-md md:text-lg font-medium flex items-center"
                    >
                      {display}
                    </motion.a>
                  ))}
                </div>
              </div>

              {/* Social icons */}
              <Social />
            </div>
          </section>
        </div>
      </FadeUp>
    </div>
  </footer>
);

export default Contact;
