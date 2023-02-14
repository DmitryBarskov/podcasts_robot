const fs = require('fs');
const ytdl = require('ytdl-core');

const storeFile = require('./src/storeFile.js');

const main = async () => {
  const videoId = 'o8hYrNsRoTs';
  let videoInfo = await ytdl.getInfo(videoId);
  let format = ytdl.chooseFormat(videoInfo.formats, { quality: '140' });
  let audio = ytdl(videoId, { format });
  return storeFile('karen.m4a', audio);
};

main().then(() => console.log("success"))
