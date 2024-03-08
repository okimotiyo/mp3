const electron = window.electron;
const mm = electron.getMusicMetaData;
const id3 = electron.id3Write;
let path = "";
let musics = [];
let image = document.getElementById("image");;
let truckNum = 0;
const playing = document.getElementById("playing");
let playButton = document.querySelector("#play");
let title = document.querySelector("#title");
let animationFrameId;
let durationInSeconds;

const seekbar = document.getElementById("seekbar");

//ミュージックフォルダとファイルのパスを設定
electron.getMusicFolderPath().then((musicFolder) => {
    // console.log('Music Folder Path:', musicFolder[0]);

    const mp3Filter = '.mp3';

    const musicArray = musicFolder[1].filter(item => item.includes(mp3Filter));

    // console.log('Music Folder :', musicArray)

    path = musicFolder[0];
    musics = [].concat(musicArray);

    audioPlayer();

});

//web Audio APIで使用するコンストラクター
window.AudioContext = window.AudioContext || window.webkitAudioContext;
const ctx = new AudioContext();

//↑で設定したファイルの読み込み
function audioPlayer() {
    ctx.suspend();

    clearPlayer();
    playing.src = path + "/" + musics[truckNum];
    const audioPath = playing.src.substring(8);
    artist.innerHTML="";
    title.innerHTML="";
    image.src="";

    // console.log('Music Folder :', musics[truckNum]);


    //メタデータから画像、タイトル、アーティスト名を抜き出して表示
    mm.parseFile(audioPath)
        .then(metadata => {
            console.log('ID3 Metadata:', metadata.common);
           

            //タイトル
            if (metadata.common.title != null || metadata.common.title != "") {
                title.innerHTML = metadata.common.title;
            } else {
                title.innerHTML = musics[truckNum]
            }

            //アーティスト
            const artist = document.getElementById("artist");
            if (metadata.common.artist != null ||metadata.common.artist != "") {
                artist.innerHTML = metadata.common.artist;
            } else if (metadata.common.albumartist != null) {
                artist.innerHTML = metadata.common.albumartist;
            } else {
                artist.innerHTML = "unknown";
            }

            // if(metadata.common.picture[0]){
                const jacket = metadata.common.picture[0].data
                // }
                // console.log(jacket);
                let blob = new Blob([jacket], { type: 'image/jpeg' });
                let imageUrl = URL.createObjectURL(blob);
                imageUrl = imageUrl;
                console.log(imageUrl);
                // 画像要素を表示
                image.src = imageUrl;
                console.log(image.src);

        })
        .catch(err => {
            console.error('Can not reading ID3 metadata:', err.message);
        });


    //楽曲の長さを取得
    function fetchArrayBuffer(url) {
        return fetch(url)
            .then(response => {
                if (!response.ok) {
                    throw new Error(`HTTP error! Status: ${response.status}`);
                }
                return response.arrayBuffer();
            });
    }

    fetchArrayBuffer(playing.src)
        .then(arrayBuffer => {

            return new Promise((resolve, reject) => {
                ctx.decodeAudioData(arrayBuffer, (audioBuffer) => {
                    // AudioBufferのdurationを取得

                    console.log('ID3 Metadata:', playing.src);
                    durationInSeconds = audioBuffer.duration;
                    resolve(durationInSeconds);
                }, (error) => {
                    reject(error);
                });
            });
        })
        .then(duration => {
            // console.log('duration (秒):', duration);
            displayDuration(duration);
        })
        .catch(error => {
            console.error('エラー:', error);
        });

}




const audioElement = document.querySelector("audio");
// Web Audio API内で使える形に変換
const track = ctx.createMediaElementSource(audioElement);

//再生、曲送りボタンの処理
playButton.addEventListener("click", function () {
    if (ctx.state === "suspended") {
        ctx.resume();
    }
    track.connect(ctx.destination);
    if (this.dataset.playing == "false") {
        audioElement.play();
        this.dataset.playing = "true";
        this.src = "./image/pause.png";
        displayCurrentTime();
    } else if (this.dataset.playing == "true") {
        audioElement.pause();
        this.dataset.playing = "false";
        this.src = "./image/play.png";
        cancelAnimationFrame(animationFrameId);
        ctx.suspend();
    }
});

document.querySelector("#next").addEventListener("click", function () {

    if (truckNum < musics.length - 1) {
        truckNum += 1;
    } else {
        truckNum = 0;
    }
    audioPlayer();

    if (ctx.state === "suspended") {
        ctx.resume();
    }

    track.connect(ctx.destination);
    if (playButton.dataset.playing == "true") {
        audioElement.play();
        playButton.dataset.playing = "true"
    } else if (playButton.dataset.playing == "false") {
        audioElement.pause();
        playButton.dataset.playing = "false"
    }
});

document.querySelector("#prev").addEventListener("click", function () {

    truckNum -= 1;
    if (truckNum < 0) {
        truckNum = 0;
    }
    audioPlayer();

    if (ctx.state === "suspended") {
        ctx.resume();
    }

    track.connect(ctx.destination);
    if (playButton.dataset.playing == "true") {
        audioElement.play();
        playButton.dataset.playing = "true"
    } else if (playButton.dataset.playing == "false") {
        audioElement.pause();
        playButton.dataset.playing = "false"
    }
    clearPlayer();

    displayDuration();
});


//再生時間（現在）の表示
function displayCurrentTime() {
    let currentTimeInSeconds = audioElement.currentTime;

    let currentminutes = Math.floor(currentTimeInSeconds / 60);
    let currentseconds = Math.floor(currentTimeInSeconds % 60);

    // 2桁表示のためのゼロパディング
    currentminutes = currentminutes < 10 ? '0' + currentminutes : currentminutes;
    currentseconds = currentseconds < 10 ? '0' + currentseconds : currentseconds;

    let now = document.querySelector("#now");
    now.innerHTML = ` ${currentminutes}:${currentseconds}`;
    seekbar.value = 0 + (100 - 0) * (audioElement.currentTime / durationInSeconds);
    animationFrameId = requestAnimationFrame(displayCurrentTime);
}

//再生時間（最大）の表示
function displayDuration(duration) {

    // AudioBufferのdurationプロパティを使用して曲の長さを取得
    durationInSeconds = duration;
    let durationminutes = Math.floor(durationInSeconds / 60);
    let durationseconds = Math.floor(durationInSeconds % 60);
    ;
    // 2桁表示のためのゼロパディング
    durationminutes = durationminutes < 10 ? '0' + durationminutes : durationminutes;
    durationseconds = durationseconds < 10 ? '0' + durationseconds : durationseconds;
    let max = document.getElementById("max");
    max.innerHTML = ` ${durationminutes}:${durationseconds}`;

}

//初期化
function clearPlayer() {
    now.innerHTML = "00:00";
    seekbar.value = 0;
}


//シークバー操作
document.addEventListener("DOMContentLoaded", function () {
    now.innerText = "00:00";

    seekbar.addEventListener("input", function () {
        let seekedTime;
        //楽曲の長さ*{シークバーの値(0～100)}%に現在時間を変更
        seekedTime = (seekbar.value / 100) * durationInSeconds;
        let durationminutes = Math.floor(seekedTime / 60);
        let durationseconds = Math.floor(seekedTime % 60);

        // 2桁表示のためのゼロパディング
        durationminutes = durationminutes < 10 ? '0' + durationminutes : durationminutes;
        durationseconds = durationseconds < 10 ? '0' + durationseconds : durationseconds;
        now.innerHTML = ` ${durationminutes}:${durationseconds}`;
        audioElement.currentTime = seekedTime;
    });
});


document.querySelector("#repeat").addEventListener("click", function () {

    if (audioElement.loop == true) {
        audioElement.loop = false
        console.log("loop=false")
    } else {
        audioElement.loop = true
        console.log("loop=true")
    }
});


document.querySelector("#title").addEventListener("click", function () {
    const artist = document.getElementById("title");
    artist.contentEditable = true;
    artist.focus();
})

document.querySelector("#artist").addEventListener("click", function () {
    const artist = document.getElementById("artist");
    artist.contentEditable = true;
    artist.focus();
})

document.querySelector("#title").addEventListener("blur", function () {
    const title = document.getElementById("title");
    let strTitle = title.innerHTML
    let tagTitle = {
        title: strTitle,
    }
    if (strTitle != "") {
        id3.update(tagTitle, path + "/" + musics[truckNum]);
    }
    strTitle ="";
    audioPlayer()
});
document.querySelector("#artist").addEventListener("blur", function () {
    const artist = document.getElementById("artist");
    let strArtist = artist.innerHTML
    let tagAritst = {
        artist: strArtist,
    }
    if (strArtist != "") {
        id3.update(tagAritst, path + "/" + musics[truckNum]);
    }
    strArtist ="";
    audioPlayer()
});