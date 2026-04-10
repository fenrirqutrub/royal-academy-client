import { IoCaretForwardOutline } from "react-icons/io5";

// import p from "../../assets/images/sir.webp";
import p from "../../assets/images/bal.webp";
import Border from "../common/Border";

const Principal = () => {
  return (
    <section className="bangla relative  ">
      <Border />

      <div className="text-left mb-3">
        <h2 className="text-4xl md:text-5xl font-bold text-[var(--color-text)]">
          অধ্যক্ষের বাণী
        </h2>
        <p className="text-[var(--color-gray)] text-2xl mt-2">রয়েল একাডেমি</p>
      </div>

      <div className="flex flex-col-reverse md:flex-row gap-10 items-center">
        {/* text */}
        <div className="md:w-2/3 space-y-1 text-lg md:text-xl  ">
          <p className="text-justify  leading-relaxed ">
            <span className="font-bold">আসসালামু আলাইকুম, </span>
            রয়েল একাডেমির পক্ষ থেকে সকল শিক্ষার্থী, অভিভাবক এবং শুভানুধ্যায়ীদের
            জানাই আন্তরিক শুভেচ্ছা ও স্বাগতম। আমাদের প্রতিষ্ঠানের মূল লক্ষ্য হলো
            শিক্ষার্থীদেরকে সুশিক্ষা, নৈতিকতা এবং মানবিক মূল্যবোধে গড়ে তোলা।{" "}
            <br />
            বর্তমান যুগ অত্যাআধুনিক প্রযুক্তি ও জ্ঞানের যুগ। তাই আমরা চেষ্টা করি
            আধুনিক শিক্ষা পদ্ধতির মাধ্যমে শিক্ষার্থীদেরকে যুগোপযোগী শিক্ষা
            প্রদান করতে। দক্ষ শিক্ষক মণ্ডলী, সুন্দর শিক্ষার পরিবেশ এবং বিভিন্ন
            সহশিক্ষা কার্যক্রমের মাধ্যমে আমরা শিক্ষার্থীদের মেধা ও সৃজনশীলতাকে
            বিকশিত করার জন্য নিরলসভাবে কাজ করে যাচ্ছি। <br />
            আমি বিশ্বাস করি, একজন শিক্ষার্থী যদি সঠিক দিকনির্দেশনা ও অনুপ্রেরণা
            পায়, তবে সে তার জীবনে অনেক দূর এগিয়ে যেতে পারবে। তাই আমাদের লক্ষ্য
            শুধু পরীক্ষায় ভালো ফলাফল অর্জন নয়, বরং একজন আদর্শ ,সৎ ও দায়িত্বশীল
            নাগরিক হিসেবে গড়ে তোলা।
          </p>

          <p className="text-justify  leading-relaxed ">
            মহান আল্লাহর রহমতে এবং সকলের সহযোগিতায় আমাদের এই শিক্ষা প্রতিষ্ঠান
            আরও এগিয়ে যাবে — এই প্রত্যাশা ব্যক্ত করছি।
          </p>

          {/* signature */}
          <p className="text-[var(--color-text)]  ml-8">ধন্যবাদান্তে ——</p>
          <p className="font-bold flex items-center gap-2 text-[var(--color-text)] text-2xl">
            <IoCaretForwardOutline className="mt-2" />
            <span>আব্দুর রাজ্জাক</span>
          </p>
          <p className="text-[var(--color-gray)] ml-8">
            অধ্যক্ষ <br /> রয়েল একাডেমি <br /> বেলকুচি, সিরাজগঞ্জ
          </p>
        </div>

        {/* image */}
        <figure className="md:w-1/3">
          <img
            src={p}
            alt="principal"
            className="rounded-xl shadow-lg w-full object-cover"
          />
        </figure>
      </div>
    </section>
  );
};

export default Principal;
