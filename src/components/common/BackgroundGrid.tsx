const BackgroundGrid = () => {
  return (
    <div>
      <div
        className="absolute inset-0 opacity-[0.03] pointer-events-none 
      bg-[linear-gradient(var(--color-text)_1px,transparent_1px),linear-gradient(90deg,var(--color-text)_1px,transparent_1px)] bg-[size:40px_40px]"
      />
    </div>
  );
};

export default BackgroundGrid;
