//! A faire : ajouter filtre gros mot (npm bad filter) + soucis mettre url location dans <p>
// socket.broadcast = > voir
// Const require
const express = require("express"); // initialisation des require nodeJs
const http = require("http");
const socketio = require("socket.io");
const port = process.env.PORT || 3000;
const { sendingMessages } = require("./src/utils/messages");
const MongoClient = require("mongodb").MongoClient;
const uri = "mongodb+srv://Becode:Becode@cluster0-bue7i.gcp.mongodb.net/test?retryWrites=true&w=majority";
const bodyParser = require("body-parser");
const session = require("express-session");
const cookie = require("cookie-parser");
const app = express();
app.disable("x-powered-by");

/*
  GESTION SESSION  ET COOKIES
*/
//const expiryDate = new Date(Date.now() + 60 * 60 * 1000);
app.use(session({ secret: "Your secret key" }));
app.use(cookie());
/*
  body parser pour récuperer les forms en html avec express
*/
app.use(bodyParser.json());
app.use(
  bodyParser.urlencoded({
    extended: true
  })
);

/*
  SERVEUR
*/
const server = http.createServer(app);
const io = socketio(server); // on passe le serveur en argument de la fct socketio

// création du routing
const path = require("path");
const publicDir = path.join(__dirname, "public");
// redirection de la page chat si pas connecté, on le met avant les requete du dossier public
app.get("/chat.html", (req, res) => {
  if (req.session.user) {
    res.sendfile("public/chat.html");
  } else {
    res.redirect("index.html");
  }
});
// passage du dossier public en static pour toute les requetes qui sont dans le dossier public
app.use(express.static(publicDir));
// touts les requetes non gerée par le routing sont renvoyées en 404
app.get("*", (_, res) => {
  res.status(404).send("error 404");
});
/*
  INSCRIPTION
*/
app.post("/signup", (req, res) => {
  let pseudo = req.body.pseudo;
  let email = req.body.email;
  let password = req.body.password;
  let user = {
    pseudo: pseudo,
    email: email,
    password: password
  };
  MongoClient.connect(uri, function(err, client) {
    if (err) {
      console.log("Error occurred while connecting to MongoDB Atlas...\n", err);
    }
    console.log("Connected to mongodb");
    const db = client.db("becode-chat");
    const users = db.collection("users");
    users.insertOne(user, (err, res) => {
      if (err) throw err;
      console.log(`user inséré`);
      client.close();
    });
    req.session.user = user.pseudo;
  });

  return res.redirect("index.html");
});
/*
  CONNECTION
*/
app.post("/connection", (req, res) => {
  let pseudo = req.body.pseudo;
  let password = req.body.password;
  let user = {
    pseudo: pseudo,
    password: password
  };
  MongoClient.connect(uri, function(err, client) {
    if (err) {
      console.log("Erreur de connection à la abse de donnée", err);
    }
    console.log("Connected to mongodb");
    const db = client.db("becode-chat");
    const users = db.collection("users");
    users.findOne({ pseudo }, (err, result) => {
      if (err) throw err;
      console.log(result);
      if (result == null) {
        return res.redirect("inscription.html");
      } else if (result.pseudo === pseudo && result.password === password) {
        req.session.user = user;
        res.cookie("pseudo", user.pseudo);

        return res.redirect("chat.html");
      } else {
        return res.redirect("inscription.html");
      }
      client.close();
    });
  });
});
/*
  DECONNECTION
*/
app.post("/disconnect", (req, res) => {
  req.session.destroy();
  res.redirect("index.html");
});
/*

  SOCKETIO

*/

let userCount = 0;

// A l'évenement 'connection' d'un utilisateur la fonction va ...
io.on("connection", (socket) => {
  console.log("Nouvel utilisateur connecté");
  userCount++;
  io.emit("userCountAdd", userCount); // a l'évenement connection le serveur va envoyer (emit()) au client un évenement 'userCountAdd' et la let userCount
  //socket.emit envoi a la connection socket en argument et io.emit a tous les utilisateur connecté
  // sendingMessages est un fct importé de messages.js
  socket.emit("welcome", sendingMessages("Bievenue sur le chat !"));
  socket.broadcast.emit("welcome", sendingMessages("Un utilisateur à rejoind le chat !"));
  /*
    message reçu du client et l'envois a tous les utilisateurs
  */
  socket.on("sendMessage", (message, pseudoUser, callback) => {
    io.emit("newMessage", sendingMessages(message, pseudoUser));
    callback();
  });
  /* 
  on recoit la position de l'user et l'envois à tous
  */
  socket.on("shareLocation", (longLat, callback) => {
    io.emit("getUserLocation", longLat);
    callback();
  });
  /*
    A l'evenement d'un utilisateur disconnected 
  */
  socket.on("disconnect", () => {
    userCount--;
    io.emit("userLeft", userCount, sendingMessages("un user à quitté le chat !"));
  });
});

// initialisation du serveur sur le port 500
server.listen(port, () => {
  console.log(`Le serveur est connecté sur le port ${port}`);
});
