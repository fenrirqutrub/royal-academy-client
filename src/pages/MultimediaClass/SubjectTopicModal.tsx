import Swal from "sweetalert2";

interface Props {
  value: string;
  img?: string;
}

const SubjectTopicModal = ({ value, img }: Props) => {
  const handleClick = () => {
    Swal.fire({
      title: value,
      ...(img && {
        imageUrl: img,
        imageWidth: 400,
        imageHeight: 200,
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
