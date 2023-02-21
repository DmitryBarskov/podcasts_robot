const ytdl = require('ytdl-core');

const fetchAudioData = async (videoLink) => {
  let videoId = ytdl.getURLVideoID(videoLink);
  let videoInfo = await ytdl.getInfo(videoId);
  let format = ytdl.chooseFormat(videoInfo.formats, { quality: '140' });
  let audio = ytdl(videoId, { format });
  let videoDetails = videoInfo.videoDetails;

  return {
    audio,
    videoId,
    performer: videoDetails.ownerChannelName,
    title: videoDetails.title,
    durationS: parseInt(videoDetails.lengthSeconds),
    sizeMb: parseInt(format.contentLength) / 1024 / 1024,
  };
}

module.exports = fetchAudioData;
