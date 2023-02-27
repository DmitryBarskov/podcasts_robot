
const EMOJIS = '😊 😇 🙂 🙃 😉 😌 😍 🥰 😘 😋 😏 🤖'.split(' ');

const randomEmoji = () => {
  return EMOJIS[Math.floor(Math.random() * EMOJIS.length)];
};

module.exports = randomEmoji;
