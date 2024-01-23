const electron = window.electron;

const mm = electron.getMusicMetaData;
var path = "";
var musics = [];
var image = document.getElementById("image");;
var num = 0;
const playing = document.getElementById("playing");
var playButton = document.querySelector("#play");
var title = document.querySelector("#title");
var animationFrameId;
var durationInSeconds;
// var shuffle = false;
// var repeat = false;

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
    playing.src = path + "/" + musics[num];
    const audioPath = playing.src.substring(8)

    // console.log('Music Folder :', musics[num]);


    //メタデータから画像、タイトル、アーティスト名を抜き出して表示
    mm.parseFile(audioPath)
        .then(metadata => {
            console.log('ID3 Metadata:', metadata.common);
            const jacket = metadata.common.picture[0].data
            // console.log(jacket);
            var blob = new Blob([jacket], { type: 'image/jpeg' }); 
            var imageUrl = URL.createObjectURL(blob);
            imageUrl = imageUrl;
            console.log(imageUrl);
            // 画像要素を表示
            image.src = imageUrl;
            console.log(image.src);

            //タイトル
            if(metadata.common.title!=null){
                title.innerHTML=metadata.common.title;
            }else{
                title.innerHTML=musics[num]
            }

            //アーティスト
            const artist = document.getElementById("artist");
            if(metadata.common.artist!=null){
            artist.innerHTML=metadata.common.artist;
            }else if(metadata.common.albumartist!=null){
                artist.innerHTML=metadata.common.albumartist;
            }else{
                 artist.innerHTML="unknown";
            }

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
                    const durationInSeconds = audioBuffer.duration;
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
        this.dataset.playing = "true"
        displayCurrentTime();
    } else if (this.dataset.playing == "true") {
        audioElement.pause();
        this.dataset.playing = "false"
        cancelAnimationFrame(animationFrameId);
        ctx.suspend();
    }
});

document.querySelector("#next").addEventListener("click", function () {

    if (num < musics.length - 1) {
        num += 1;
    } else {
        num = 0;
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
});

document.querySelector("#prev").addEventListener("click", function () {

    num -= 1;
    if (num < 0) {
        num = 0;
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

    var now = document.querySelector("#now");
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
    var max = document.getElementById("max");
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
        var seekedTime;
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


