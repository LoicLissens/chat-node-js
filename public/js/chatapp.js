const socket = io(); // évenement 'connection'

// DOM element select
const $messageSend = document.getElementById("message-send");
const $messageSendInput = $messageSend.querySelector("input");
const $messageSendButton = $messageSend.querySelector("button");
const $locationButton = document.getElementById("location");
const $chatRendered = document.getElementById("chat-rendered");
const pseudoUser = document.cookie.substr(7, 8);

/*

    EVENEMENT SOCKET.IO

*/
// quand le serveur envoi l'évenement userCountAdd au client, le client va ...
socket.on("userCountAdd", (userCount) => {
  console.log("Le nouvel utilisateur a été ajouter au compteur. Il y en a: " + userCount);
  document.getElementById("user-online").innerHTML = `Il y a  ${userCount} utilisateur en ligne`;
});
// fct de connection, message de bievenue
socket.on("welcome", (welcomMessage) => {
  insertMessage(welcomMessage);
});
// fct de deconnection
socket.on("userLeft", (userCount, leftUserMessage) => {
  insertMessage(leftUserMessage);
  document.getElementById("user-online").innerHTML = `Il y a  ${userCount} utilisateur en ligne`;
});
// display le message reçu du serveur, l'arg message est une fct retournant un objet contenan le message et la date et pseudo
socket.on("newMessage", (message) => {
  console.log(message);
  insertMessage(message);
});
// fonction pour recevoir la localisation d'un user et la display
socket.on("getUserLocation", (longLat) => {
  console.log(`Un utilisateur à partager sa position: ${longLat.latitude}, ${longLat.longitude}`);
  insertLocation(longLat);
});
/*

    EVENEMENT JS DOM

*/
// fonction qui envoi le message au serveur
$messageSend.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = document.getElementById("message").value;
  if (message === null || message === "") {
    document.getElementById("message").setAttribute("placeholder", "Message non valide !");
    document.getElementById("message").classList.add("wrong-message");
  } else {
    $messageSendButton.setAttribute("disabled", "disabled");
    socket.emit("sendMessage", message, pseudoUser, () => {
      $messageSendInput.value = "";
      $messageSendInput.focus();
      $messageSendButton.removeAttribute("disabled");
      document.getElementById("message").setAttribute("placeholder", "Votre message");
      document.getElementById("message").classList.remove("wrong-message");
      console.log("message envoyé");
    });
  }
});

// fonction pour fetch la localisation de l'user et l'envoyer au serveur
$locationButton.addEventListener("click", () => {
  if (!navigator.geolocation) {
    // si l'api de geolocalisation n'existe pas coté client...
    return alert("geolocalisation non supportée pas le navigateur, laissez tombé edge !");
  }
  $locationButton.setAttribute("disabled", "disabled");
  navigator.geolocation.getCurrentPosition((userPosition) => {
    // on fetch la localisation de l'user et l'envois au serv sous forme d'objet
    socket.emit(
      "shareLocation",
      {
        latitude: userPosition.coords.latitude,
        longitude: userPosition.coords.longitude
      },
      () => {
        $locationButton.removeAttribute("disabled");
        console.log("position partagée");
      }
    );
  });
});
/*

  FONCTION

  */
// ici message est une fct passée en argument retournant un  objet contenant du text(txt) et le temps en milliseconde  (time)
// J'utilise la libraire moment.js pour la gestion du timing (https://momentjs.com/docs/#/displaying/)
const insertMessage = (message) => {
  const $creatMessage = document.createElement("p");
  $chatRendered.appendChild($creatMessage).innerHTML = `${moment(message.time).format("HH:mm")} - ${message.pseudo}: ${message.txt}`;
  if (message.pseudo === "Chatbot") {
    $chatRendered.appendChild($creatMessage).classList.add("message-bot");
  } else {
    $chatRendered.appendChild($creatMessage).classList.add("message");
  }
};

const insertLocation = (longLat) => {
  const $creatMessage = document.createElement("a");
  $chatRendered.appendChild($creatMessage).innerHTML = `Ma position !`;
  $chatRendered.appendChild($creatMessage).classList.add("location");
  $chatRendered.appendChild($creatMessage).setAttribute("href", `https://www.google.fr/maps/@${longLat.latitude}, ${longLat.longitude}`);
  $chatRendered.appendChild($creatMessage).setAttribute("target", "_blank");
};
