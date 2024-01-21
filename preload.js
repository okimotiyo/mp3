const { ipcRenderer, contextBridge } = require('electron');
// const mm = require('music-metadata');


contextBridge.exposeInMainWorld('electron', {

  getMusicMetaData: require('music-metadata'),

  getMusicFolderPath: () => ipcRenderer.invoke('get-music-folder-path'),

});