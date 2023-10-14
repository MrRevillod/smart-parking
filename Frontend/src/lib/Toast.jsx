import Swal from "sweetalert2";

export default function Toast(
    { msg = "Bien Hecho", pos = "bottom-right" },
    callback = () => {}
) {
    Swal.fire({
        text: msg,
        position: pos,
        iconHtml:
            "<img src='../../public/logo_.png' class=' card-img overflow-hidden' ><img/>",
        width: "300px",
        customClass: {
            icon: "no-border",
        },
        showConfirmButton: false,
        timer: 800,
    });

    return new Promise((resolve) => setTimeout(resolve, 800));
}
