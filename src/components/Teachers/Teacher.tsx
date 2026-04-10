// src/components/Teachers/Teacher.tsx
import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import axiosPublic from "../../hooks/axiosPublic";
import TeacherCard, { type TeacherData } from "./TeacherCard";

import { Swiper, SwiperSlide } from "swiper/react";
import { Autoplay, EffectCoverflow } from "swiper/modules";
import "swiper/css";
import "swiper/css/pagination";
import "swiper/css/effect-coverflow";
import "swiper/css/autoplay";

// ── Skeleton Card ─────────────────────────────────────────────────────────────
const SkeletonCard = () => (
  <div className="flex flex-col items-center gap-3 px-4 py-5 rounded-2xl mx-3 animate-pulse bg-[var(--color-active-bg)] border border-[var(--color-active-border)]">
    <div className="w-14 h-14 rounded-xl bg-[var(--color-active-border)]" />
    <div className="w-full flex flex-col items-center gap-2 bg-[var(--color-active-border)]">
      <div className="h-2.5 w-4/5 rounded-full" />
      <div className="h-2 w-1/2 rounded-full bg-[var(--color-active-border)]" />
    </div>
  </div>
);

const skeletons = Array.from({ length: 6 });

// ── Main ──────────────────────────────────────────────────────────────────────
const Teacher = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["teachers"],
    queryFn: async () => {
      const res = await axiosPublic.get("/api/users");
      const result: TeacherData[] = res.data?.data ?? res.data ?? [];
      return result;
    },
  });

  const teachers = (data ?? []).filter(
    (t) => t.role === "teacher" || t.role === "admin" || t.role === "principal",
  );

  // Slides তৈরি করো - loop এর জন্য minimum 6 টা দরকার
  const createDisplaySlides = (): TeacherData[] => {
    if (teachers.length === 0) return [];
    if (teachers.length >= 6) return teachers;

    // যত দরকার তত duplicate করো
    const result: TeacherData[] = [];
    while (result.length < 6) {
      result.push(...teachers);
    }
    return result;
  };

  const displaySlides = createDisplaySlides();
  const hasEnoughSlides = displaySlides.length >= 6;

  return (
    <section className="py-12 bg-[var(--color-bg)] relative">
      <div className="w-full h-px bg-[var(--color-active-border)]" />

      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        className="px-6 mt-16 mb-8 text-center bangla"
      >
        <h2 className="text-3xl sm:text-4xl font-bold tracking-wider text-[var(--color-text)]">
          শিক্ষক মন্ডলী
        </h2>
        <p className="text-xl md:text-2xl mt-2 text-[var(--color-gray)]">
          আমাদের অভিজ্ঞ ও দক্ষ শিক্ষকবৃন্দ
        </p>
      </motion.div>

      {/* Content */}
      {isError ? (
        <p className="text-center text-sm bangla text-[var(--color-gray)]">
          তথ্য লোড করতে সমস্যা হয়েছে।
        </p>
      ) : teachers.length === 0 && !isLoading ? (
        <p className="text-center text-sm bangla text-[var(--color-gray)] py-8">
          কোনো শিক্ষক পাওয়া যায়নি।
        </p>
      ) : (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ duration: 0.4, delay: 0.2 }}
        >
          {isLoading ? (
            // Loading state - simple grid
            <div className="flex justify-center gap-4 px-4 overflow-hidden">
              {skeletons.slice(0, 4).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <Swiper
              key={`swiper-${displaySlides.length}`} // Force re-init when slides change
              effect="coverflow"
              grabCursor
              centeredSlides
              slidesPerView={3}
              spaceBetween={15}
              loop={hasEnoughSlides}
              speed={800}
              autoplay={{
                delay: 2000,
                disableOnInteraction: false,
                pauseOnMouseEnter: true,
              }}
              coverflowEffect={{
                rotate: 45,
                stretch: 0,
                depth: 100,
                modifier: 1,
                slideShadows: true,
              }}
              breakpoints={{
                320: {
                  slidesPerView: 1,
                  spaceBetween: 10,
                },
                480: {
                  slidesPerView: 2,
                  spaceBetween: 15,
                },
                768: {
                  slidesPerView: 3,
                  spaceBetween: 20,
                },
                1024: {
                  slidesPerView: 4,
                  spaceBetween: 20,
                },
                1280: {
                  slidesPerView: 5,
                  spaceBetween: 25,
                },
              }}
              modules={[EffectCoverflow, Autoplay]}
              className="mySwiper !px-4 !py-2"
            >
              {displaySlides.map((t, index) => (
                <SwiperSlide key={`${t._id}-${index}`}>
                  <TeacherCard teacher={t} />
                </SwiperSlide>
              ))}
            </Swiper>
          )}
        </motion.div>
      )}
    </section>
  );
};

export default Teacher;
