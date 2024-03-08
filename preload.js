const { ipcRenderer, contextBridge } = require('electron');
// const mm = require('music-metadata');


contextBridge.exposeInMainWorld('electron', {

  getMusicMetaData: require('music-metadata'),

  id3Write: require('node-id3'),

  getMusicFolderPath: () => ipcRenderer.invoke('get-music-folder-path'),

});