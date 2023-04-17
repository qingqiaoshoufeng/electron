
const { ipcRenderer } = require('electron');

// 查询=是否有更新
export const checkUpdateAll = async()=>{
  const res = await ipcRenderer.invoke('check-update-all')
  return res
}
// 确认进行更新
export const confirmUpdate = async()=>{
  const res = await ipcRenderer.invoke('confirm-update')
  return res
}

export const confirmDownloadUpdate = async()=>{
  const res = await ipcRenderer.invoke('confirm-downloadUpdate')
  return res
}

export const existLatestFullPackage = ()=>{
  const res =  ipcRenderer.invoke('existLatestFullPackage')
  return res
  
}

export const handleUpdateAll = async(url:string,name:string,updateParamsInfo:any)=>{
  console.log(1111,url,name,updateParamsInfo);
  const res = await ipcRenderer.invoke('UpdateAll',url,name,updateParamsInfo)
  return res
}

export const reciveUpdateInfo = (callback:any)=>{
  ipcRenderer.on('updateMessageInfo',(event:any,data:any)=>{
    console.log('****',event,data);
    callback(data)
  })
}
// const checkUpdateAll = (ipcMain:IpcMain)=>{
//   const checkForUpdates = async ()=>{
//     autoUpdater.checkForUpdates().catch(err => {
//       console.log('网络连接问题', err)
//     })
//   }
//   ipcMain.handle('check-update', (event: unknown) => checkForUpdates());
// }

// const confirmUpdate = (ipcMain:IpcMain)=>{
//   const checkForUpdates = async ()=>{
//     autoUpdater.quitAndInstall()
//   }
//   ipcMain.handle('confirm-update', (event: unknown) => checkForUpdates());
// }

// const confirmDownloadUpdate = (ipcMain:IpcMain)=>{
//   const checkForUpdates = async ()=>{
//     autoUpdater.downloadUpdate()
//   }
//   ipcMain.handle('confirm-downloadUpdate', (event: unknown) => checkForUpdates());
// }
