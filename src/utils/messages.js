const sendingMessages = (txt, pseudo) => {
  if (pseudo === undefined) {
    pseudo = "Chatbot";
  }

  return {
    txt,
    time: new Date().getTime(),
    pseudo
  };
};

module.exports = {
  sendingMessages
};
