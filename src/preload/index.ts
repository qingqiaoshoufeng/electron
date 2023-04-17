// All of the Node.js APIs are available in the preload process.
// It has the same sandbox as a Chrome extension.
// const path = require('path');
// import { getRenderVal } from '../utils/render_store';


const { contextBridge, ipcRenderer } = require('electron');
import internetAvailable from 'internet-available';
import { pingNetWork } from '../utils/machineState';
import { checkUpdateAll, confirmDownloadUpdate, confirmUpdate, existLatestFullPackage, handleUpdateAll, reciveUpdateInfo } from './check_update_all';
import { faceScan } from "./faceScan";
import { mouthScan } from "./mouthScan";
import { orthodontic } from "./orthodontic";
import { clearPackage, closeDownloadPlugin, downloadPlugin, getPluginDownloading, installPlugin, plugins, uninstallPlugin } from "./plugins";
const remote = require('@electron/remote');


// 打开文件部分的逻辑
const openFile = async(oldPath:string,type:string)=>{
  const path = await ipcRenderer.invoke('openFileDialog', {oldPath,type})
  remote.getGlobal('settingInfo')[type] = path
  return path
}

//selectedscanUploadFile
const selectedscanUploadFile = async(oldPath:string,type:string)=>{
  const path = await ipcRenderer.invoke('selectedscanUploadFile', {oldPath,type})
  return path
}

// 设置快捷键部分
const shortcutSetting = async({keys,type}:{
  keys:string
  type:string
})=>{
  const res = await ipcRenderer.invoke('setShortcut', {keys,type})
  console.log(res);
  return remote.getGlobal('shortcutKeys')[type]
}

// 移除快捷键
const shortcutRemove = async({type}:{
  type:string
})=>{
  const res = await ipcRenderer.invoke('shortcutRemove', {type})
  console.log(res);
  return true
}
// 查看缓存部分
const getCacheSize = async()=>{
  const res = await ipcRenderer.invoke('getCacheSize')
  console.log(res);
  return res
}
// 清除缓存
const clearCache = async()=>{
  const res = await ipcRenderer.invoke('clearCache')
  console.log('clearCache',res);
  return res
}
// 触发系统提示
const notification = async(params:{title:string,body:string})=>{
  const res = await ipcRenderer.invoke('notification',params)
  console.log('notification',res);
  return res
}
// 提示开关
const triggerNotice = async(isOpen:boolean)=>{
  const res = await ipcRenderer.invoke('triggerNotice',isOpen)
  console.log('triggerNotice',res);
  return res
}
// 提示音开关
const triggerNoticeSound = async(isOpen:boolean)=>{
  const res = await ipcRenderer.invoke('triggerNoticeSound',isOpen)
  console.log('triggerNoticeSound',res);
  return res
}

// 存入用户信息
const saveUserInfo = async (userInfo:string)=>{
  const res = await ipcRenderer.invoke('saveUserInfo',userInfo)
  return res
}
// 存储api信息
const saveApiInfo = async ()=>{
  console.log('apiInfo');
  const res = await ipcRenderer.invoke('saveApiInfo')
  return res
}
// 重启方法
const restart = async ()=>{
  ipcRenderer.send("window-reset");
  // console.log('restart');
  // const res = await ipcRenderer.invoke('relaunch')
  // return res
}

//获取系统路径
const appPath = async (name:string)=>{
  const tarPath = await ipcRenderer.invoke('getAppPath',name)
  return tarPath;
}

// 获取系统版本
const getVersion = async ()=>{
  const info = await ipcRenderer.invoke('get-version')
  return info;
}

// 获取resouce
const getApiConfig = async ()=>{
  console.log('getResoucesPath');
  const res = await ipcRenderer.invoke('getApi')
  return res
}
const systemInfo = async ()=>{
  return {
    data:{
      appName: await ipcRenderer.invoke('getAppName')
    }
  }
}

const hotRefreshPatch = (patchUrl:string,modelCode:string,fileName:string) => {
  ipcRenderer.invoke('hotRefreshPatch',patchUrl,modelCode,fileName)
}

//  setMaxWindow(ipcMain),closeWindow(ipcMain),setMinWindow(ipcMain),quitMaxWindow(ipcMain)
const setMaxWindow = async ()=>{
  const res = await ipcRenderer.invoke('setMaxWindow')
  return res
}
const closeWindow = async ()=>{
  const res = await ipcRenderer.invoke('closeWindow')
  return res
}
const setMinWindow = async ()=>{
  const res = await ipcRenderer.invoke('setMinWindow')
  return res
}
const quitMaxWindow = async ()=>{
  const res = await ipcRenderer.invoke('quitMaxWindow')
  return res
}

// 删除文件监听事件
const deleteMonitor = async (path:string)=>{
  const res = await ipcRenderer.invoke('deleteMonitor',path)
  return res
}
// 上传并绑定监控文件
const uploadMonitorFile = async (path:string)=>{
  ipcRenderer.invoke('uploadMonitorFile',path)
}

// 注册打开app函数
contextBridge.exposeInMainWorld('electron', {
  openLoginServe: false,
  appName:'doctordesk',
  dentalServerPort: remote.getGlobal('dentalServerPort'),
  selectedscanUploadFile,
  openFile,systemInfo,
  mouthScan,faceScan,orthodontic,installPlugin,downloadPlugin,plugins,clearPackage,uninstallPlugin,closeDownloadPlugin,getPluginDownloading,
  shortcutSetting,
  getCacheSize,
  clearCache,
  notification,
  triggerNotice,
  triggerNoticeSound,
  saveUserInfo,
  pingNetWork,
  restart,
  getApiConfig,
  saveApiInfo,
  shortcutRemove,
  hotRefreshPatch,
  checkUpdateAll,confirmUpdate,confirmDownloadUpdate,appPath,handleUpdateAll,existLatestFullPackage,getVersion,
  setMaxWindow,closeWindow,setMinWindow,quitMaxWindow,reciveUpdateInfo,deleteMonitor,uploadMonitorFile,
  openModule:(modulePath:string)=>{
    console.log('收到url == ',modulePath);
    ipcRenderer.send('load-module', modulePath)
  },
  getGlobalinfo: (name:string) => {
    return remote.getGlobal(name);
  },
  getGlobalinfoAsync: async(name:string) => {
    return remote.getGlobal(name);
  },
  setGlobalinfo: ({name,value}:{
    name:string,
    value:unknown
  }) => {
    console.log('global===', global);
    return remote.getGlobal('settingInfo')[name] = value;
  },
  checkOpenAutoStart: (val: boolean) => {
    ipcRenderer.send('autoStart',val)
  },
  isOnline: (domainName:string)=>{
    return new Promise(async (resolve, reject) => {
      internetAvailable({
        timeout: 5000,
        retries: 2,
        domainName: domainName || 'baidu.com',
        port: 53,
      }).then(() => {
        console.log('[ 网络状态 ] >', true)
        resolve(true)
      }).catch(() => {
        resolve(false)
        console.log('[ 网络状态 ] >', false)
      });
    })

  },
  openMenu: (callback:any) => ipcRenderer.on('openMenu',(name,key)=>{
    console.log('****',name,key);
    callback(key)
  }),
  updateMessage:(callback:any)=>ipcRenderer.on('updateMessage',(name,info)=>{
    console.log('updateMessage',name,info);
    callback(info)
  }),
  responseListener:(callback:any) => ipcRenderer.on('responseListener',(name,id,params)=>{
    console.log('****',name,id,params);
    callback(id,params)
  }),
  // 数据监控更新通知
  openDataMonitorDialog:(callback:any)=>{
    ipcRenderer.on('openDataMonitorDialog',(event:any,data:any)=>{
      console.log(11111);
      console.log('****',event,data);
      callback(data)
    })
  },
  // 绑定监控文件与扫描单
  bindScanOrder:(callback:any)=>{
    ipcRenderer.on('bindScanOrder',(event:any,data:any)=>{
      console.log(11111);
      console.log('****',event,data);
      callback(data)
    })
  },
  setZoom:(callback:any) => ipcRenderer.on('setZoom',(name,id,params)=>{
    console.log('****',name,id,params);
    callback(id,params)
  }),
  openDiyDialog:(callback:any)=>ipcRenderer.on('openDiyDialog',(params)=>{
    console.log('openDiyDialog',params);
    callback(params)
  })
  // openDiyDialog1:()=>{
  //   console.log(2222);
  //   ipcRenderer.invoke('openDiyDialog',{title:11111})
  // }
});

contextBridge.exposeInMainWorld('creatWin', (name:any, arg:any) => {
  console.log('打开新窗口：', name);
  ipcRenderer.send('createWindow', name, arg);
});

// 盒子更新，事件注册并暴露给render进程
contextBridge.exposeInMainWorld('update', {
  sendMessage: (type:string, data:any) => ipcRenderer.send(type, data),
  onmessage: (name:string, callback:any) => {
    ipcRenderer.on(name, callback);
  },
  startHotUpdate: (config:any) => ipcRenderer.send('startHotUpdate', config),
  getVersion: () => {
    return require('@electron/remote').getGlobal('boxVersion');
  },
});

