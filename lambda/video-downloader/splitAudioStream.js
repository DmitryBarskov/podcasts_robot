const cp = require('child_process');
const fs = require('fs');
const ffmpeg = require('ffmpeg-static');

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
const splitAudioStream = async (
  audio, { maxSegmentSizeMb, sizeMb, durationS, dirname, prefix }
) => {
  console.debug('invoke splitAudioStream', { maxSegmentSizeMb, sizeMb, durationS, dirname, prefix });

  fs.mkdirSync(`/tmp/${dirname}`, { recursive: true });

  if (sizeMb < maxSegmentSizeMb) {
    console.debug('Continue without splitting');
    const filename = `${prefix}.m4a`;
    const tmpPath = `${dirname}/${filename}`;
    const fullPath = `/tmp/${tmpPath}`;

    fs.createWriteStream(fullPath, audio);

    return Promise.resolve([
      {
        stream: fs.createReadStream(fullPath),
        tmpPath,
        filename,
        fullPath,
        segmentDurationS: durationS,
      }
    ]);
  }

  const segments = segmentsAmount({ maxSegmentSizeMb, fileSizeMb: sizeMb });
  const segmentDurationS = segmentDuration({
    segmentsAmount: segments, duration: durationS
  });

  console.debug('Splitting...', {
    maxSegmentSizeMb,
    sizeMb,
    durationS,
    dirname,
    prefix,
    segments,
    segmentDurationS,
  });

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

  return new Promise((resolve, _reject) => {
    ffmpegProcess.on('close', () => {
      const segmentsData = fs.readdirSync(`/tmp/${dirname}`).map((filename, index, fileList) => {
        const tmpPath = `${dirname}/${filename}`;
        const fullPath = `/tmp/${tmpPath}`;
        const currentSegmentDurationS = (
          index === fileList.length - 1
            ? lastSegmentDuration({ segmentsAmount: segments, duration: durationS })
            : segmentDurationS
        );
        return ({
          stream: fs.createReadStream(fullPath),
          tmpPath,
          filename,
          fullPath,
          segmentDurationS: currentSegmentDurationS,
        });
      });

      resolve(segmentsData);
    });
  });
};

const cleanUp = (videoId) => {
  fs.rm(`/tmp/${videoId}`, { recursive: true, force: true }, err => {
    if (err) {
      console.err('Error cleaning up', err);
    }
  });
};

module.exports = { splitAudioStream, cleanUp };
