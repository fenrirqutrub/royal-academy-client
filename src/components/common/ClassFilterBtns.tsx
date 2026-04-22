import { useMemo } from "react";
import AnimatedFilterPills from "./AnimatedFilterPills";
import { CLASS_ORDER } from "../../utility/Constants";
import type { DailyLessonData } from "../../pages/DailyLesson/DailyLessonUpdateModals";

interface ClassFilterBtnsProps {
  activeId: string;
  onChange: (id: string) => void;
  data: DailyLessonData[];
  disabled?: boolean;
}

const ClassFilterBtns = ({
  activeId,
  onChange,
  data,
  disabled = false,
}: ClassFilterBtnsProps) => {
  const classes = useMemo(() => {
    const seen = new Set<string>();
    const result: string[] = [];

    data.forEach((lesson) => {
      if (!seen.has(lesson.class)) {
        seen.add(lesson.class);
        result.push(lesson.class);
      }
    });

    return result.sort(
      (a, b) => (CLASS_ORDER[a] ?? 99) - (CLASS_ORDER[b] ?? 99),
    );
  }, [data]);

  return (
    <AnimatedFilterPills
      items={classes}
      activeId={activeId}
      onChange={onChange}
      disabled={disabled}
      layoutId="daily-lesson-class-pill"
    />
  );
};

export default ClassFilterBtns;
