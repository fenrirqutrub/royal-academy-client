interface SubjectTitleProps {
  children: React.ReactNode;
}

interface SubjectDescriptionProps {
  children: React.ReactNode;
}

export const SubjectTitle = ({ children }: SubjectTitleProps) => {
  return (
    <div>
      <h2 className="text-2xl font-bolder bangla mt-6">{children}</h2>
    </div>
  );
};

export const SubjectDescription = ({ children }: SubjectDescriptionProps) => {
  return (
    <div>
      <p className="bangla text-lg text-justify mt-3">{children}</p>
    </div>
  );
};
