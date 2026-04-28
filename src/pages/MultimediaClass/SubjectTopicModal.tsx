import Swal from "sweetalert2";

interface Props {
  value: string;
  img?: string;
}

const SubjectTopicModal = ({ value, img }: Props) => {
  const handleClick = () => {
    Swal.fire({
      title: value,
      width: "100vw",
      grow: "fullscreen",
      customClass: {
        popup: "!rounded-none !m-0 !p-6",
        title: "!text-2xl bangla",
        image: "!max-h-[70vh] !object-contain",
      },
      showCloseButton: true,
      ...(img && {
        imageUrl: img,
        imageWidth: "100%",
        imageHeight: "auto",
        imageAlt: value,
      }),
    });
  };

  return (
    <span
      onClick={handleClick}
      className="cursor-pointer text-blue-600 underline underline-offset-2 hover:text-blue-800"
    >
      {value}
    </span>
  );
};

export default SubjectTopicModal;
