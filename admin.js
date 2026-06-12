import {
    db,

    ref,
    push,
    set

} from "./firebase.js";

/*
============================
DOM
============================
*/

const nameInput =
document.getElementById(
    "name"
);

const teamInput =
document.getElementById(
    "team"
);

const laneInput =
document.getElementById(
    "lane"
);

const skillInput =
document.getElementById(
    "skill"
);

const clutchInput =
document.getElementById(
    "clutch"
);

const synergyInput =
document.getElementById(
    "synergy"
);

const costInput =
document.getElementById(
    "cost"
);

const imageInput =
document.getElementById(
    "image"
);

const preview =
document.getElementById(
    "preview"
);

const saveBtn =
document.getElementById(
    "saveBtn"
);

const message =
document.getElementById(
    "message"
);

/*
============================
PREVIEW IMAGE
============================
*/

imageInput.addEventListener(
    "change",
    e => {

        const file =
            e.target.files[0];

        if(!file)
            return;

        preview.src =
            URL.createObjectURL(
                file
            );
    }
);

/*
============================
SAVE PLAYER
============================
*/

saveBtn.addEventListener(
    "click",
    async ()=>{

        try{

            console.log("saveBtn clicked");
            message.innerText = "Đang lưu...";

            const file =
                imageInput.files[0];

            if(!file){

                alert("Chọn ảnh");

                return;
            }

            const imageBase64 =
                await convertToBase64(file);

            const playersRef =
                ref(db,"players");

            const newPlayer =
                push(playersRef);

            await set(
                newPlayer,
                {
                    name:nameInput.value,

                    team:teamInput.value,

                    lane:laneInput.value,

                    skill:Number(
                        skillInput.value
                    ),

                    clutch:Number(
                        clutchInput.value
                    ),

                    synergy:Number(
                        synergyInput.value
                    ),

                    cost:Number(
                        costInput.value
                    ),

                    image:imageBase64
                }
            );

            message.innerText = "✔ Đã lưu player";

            clearForm();

        }
        catch(err){

            console.error(err);
            message.innerText = "Lỗi: " + (err.message || JSON.stringify(err));

            alert(err.message || JSON.stringify(err));
        }
    }
);

/*
============================
CLEAR FORM
============================
*/

function clearForm(){

    nameInput.value = "";
    teamInput.value = "";

    skillInput.value = "";
    clutchInput.value = "";
    synergyInput.value = "";

    costInput.value = "1";

    imageInput.value = "";

    preview.src = "";

}

function convertToBase64(file){

    return new Promise((resolve,reject)=>{

        const reader = new FileReader();

        reader.readAsDataURL(file);

        reader.onload = () =>
            resolve(reader.result);

        reader.onerror = error =>
            reject(error);
    });
}