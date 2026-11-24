const { contextBridge } = require('electron')

contextBridge.exposeInMainWorld('studio', {
  platform: process.platform,
})
