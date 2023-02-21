const cp = require('child_process');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');
const { dirname } = require('path');

const segmentsAmount = ({ fileSizeMb, maxSegmentSizeMb }) =>
  Math.floor(fileSizeMb / maxSegmentSizeMb) + 1;

const segmentDuration = ({ segmentsAmount, duration }) =>
  Math.ceil(duration / segmentsAmount);

const lastSegmentDuration = ({ segmentsAmount, duration }) =>
  duration - segmentsAmount * segmentDuration({ segmentsAmount, duration });

/**
 *
 * @param {Stream} audio audio stream to split
 * @param {number} maxSegmentSizeMb
 * @param {number} sizeMb
 * @param {number} durationS
 * @param {String} dirname files will be stored in /tmp/<dirname>/
 * @param {String} prefix prefix for all the resulting segments
 * @returns {Object[]} streams of all the segments and their metadata
 */
const splitAudioStream = (
  audio, { maxSegmentSizeMb, sizeMb, durationS, dirname, prefix }
) => {
  console.debug('Splitting', { maxSegmentSizeMb, sizeMb, durationS, dirname, prefix });
  let segments = segmentsAmount({ maxSegmentSizeMb, fileSizeMb: sizeMb });
  let segmentDurationS = segmentDuration({
    segmentsAmount: segments, duration: durationS
  });

  fs.mkdirSync(`/tmp/${dirname}`, { recursive: true });

  const ffmpegProcess = cp.spawn(ffmpeg, [
    '-loglevel', '8', '-hide_banner',
    '-i', 'pipe:3',
    '-f', 'segment',
    '-segment_time', segmentDurationS.toString(),
    '-reset_timestamps', '1',
    '-c', 'copy',
    `/tmp/${dirname}/${prefix}.%03d.m4a`
  ], {
    windowsHide: true,
    stdio: [
      /* Standard: stdin, stdout, stderr */
      'inherit', 'inherit', 'inherit',
      /* Custom: pipe:3 */
      'pipe',
    ],
  });
  audio.pipe(ffmpegProcess.stdio[3]);

  return fs.readdirSync(`/tmp/${dirname}`).map((filename, index, fileList) => {
    let tmpPath = `${dirname}/${filename}`;
    let fullPath = `/tmp/${tmpPath}`;
    let currentSegmentDurationS = (
      index === fileList.length - 1 ?
        lastSegmentDuration({ segmentsAmount: segments, duration: durationS }) :
        segmentDurationS
    );
    return ({
      stream: fs.createReadStream(fullPath),
      tmpPath,
      filename,
      fullPath,
      segmentDurationS: currentSegmentDurationS,
    });
  });
};

const cleanUp = (videoId) => {
  fs.rm(`/tmp/${videoId}`, { recursive: true, force: true });
}

module.exports = { splitAudioStream, cleanUp };
