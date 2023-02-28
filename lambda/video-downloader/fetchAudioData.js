const ytdl = require('ytdl-core');

const fetchAudioData = async (videoLink) => {
  const videoId = ytdl.getURLVideoID(videoLink);
  const videoInfo = await ytdl.getInfo(videoId);
  const format = ytdl.chooseFormat(videoInfo.formats, { quality: '140' });
  const audio = ytdl(videoId, { format });
  const videoDetails = videoInfo.videoDetails;

  return {
    audio,
    videoId,
    performer: videoDetails.ownerChannelName,
    title: videoDetails.title,
    durationS: parseInt(videoDetails.lengthSeconds),
    sizeMb: parseInt(format.contentLength) / 1024 / 1024,
  };
};

module.exports = fetchAudioData;
