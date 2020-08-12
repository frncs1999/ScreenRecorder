const videoElement = document.querySelector('video')
const startBtn = document.getElementById('startBtn')
const stopBtn = document.getElementById('stopBtn')

const videoSelectBtn = document.getElementById('videoSelectBtn')
videoSelectBtn.onclick = getVideoSources

const exitBtn = document.getElementById('exit')
exitBtn.onclick = e => {
    window.close()
}

startBtn.onclick = e => {
  mediaRecorder.start();
  startBtn.classList.add('is-danger');
  startBtn.innerText = 'RECORDING';
}

stopBtn.onclick = e => {
    mediaRecorder.stop();
    startBtn.classList.remove('is-danger');
    startBtn.innerText = 'START';
}

const { desktopCapturer, remote } = require('electron')
const { Menu } = remote

async function getVideoSources() {
    const inputSources = await desktopCapturer.getSources({
        types: ['window', 'screen']
      })

    const videoOptionsMenu = Menu.buildFromTemplate(
        inputSources.map(source => {
            return {
              label: source.name,
              click: () => selectSource(source)
            }
        })
    )
    videoOptionsMenu.popup()
}

let mediaRecorder
const recordedChunks = []

async function selectSource(source) {
    
    videoSelectBtn.innerText = source.name

    const constraints = {
        audio: false,
        video: {
          mandatory: {
            chromeMediaSource: 'desktop',
            chromeMediaSourceId: source.id
          }
        }
    }

    const stream = await navigator.mediaDevices.getUserMedia(constraints);

    videoElement.srcObject = stream;
    videoElement.play();

    const options = { mimeType: 'video/webm; codecs=vp9' };
    mediaRecorder = new MediaRecorder(stream, options);

    mediaRecorder.ondataavailable = handleDataAvailable;
    mediaRecorder.onstop = handleStop;
}

function handleDataAvailable(e) {
    console.log('video data available');
    recordedChunks.push(e.data);
}

const { dialog } = remote

const { writeFile } = require('fs')

async function handleStop(e) {
    const blob = new Blob(recordedChunks, {
      type: 'video/webm; codecs=vp9'
    })

    const buffer = Buffer.from(await blob.arrayBuffer())

    let d = new Date()

    const { filePath } = await dialog.showSaveDialog({
        buttonLabel: 'Save video',
        defaultPath: `Screen_Recorded_${d.getMonth()}-${d.getDate()}-${d.getFullYear()}_${d.getHours()}_${d.getMinutes()}_${d.getSeconds()}.webm`
    })

    if (filePath) {
        writeFile(filePath, buffer, () => console.log('video saved successfully!'));
      }


}