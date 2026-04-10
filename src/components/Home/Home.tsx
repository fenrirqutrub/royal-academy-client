import { useEffect } from "react";
import Hero from "../Hero/Hero";
import Notice from "../../pages/Notice/Notice";
import Principal from "../Intro/Principal";
import VicePrincipal from "../Intro/VicePrincipal";
import Teacher from "../Teachers/Teacher";
import AmaderKotha from "../Intro/AmaderKotha";
import Contact from "../Contact/Contact";
import DailyUpdateDLWE from "../DailyUpdateDLWE/DailyUpdateDLWE";

const Home = () => {
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  return (
    <div className="">
      <Hero />
      <Notice />
      <DailyUpdateDLWE />
      <AmaderKotha />
      <Principal />
      <VicePrincipal />
      <Teacher />
      <Contact />
    </div>
  );
};

export default Home;
