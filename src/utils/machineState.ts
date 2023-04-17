import AutoLaunch from 'auto-launch';
import type {
  App,
  IpcMain
} from 'electron';
import { globalShortcut, Notification } from 'electron';
import formatBytes from 'format-bytes';
import fs from 'fs-extra';
import internetAvailable from 'internet-available';
import path from 'path';


// 设置开机启动项流程
export const registerOpenAutoStart = (app: App, ipcMain: IpcMain) => {
  ipcMain.on('autoStart', (event: unknown,state:boolean) => {

    var minecraftAutoLauncher = new AutoLaunch({
      name: app.getName(),
      path: app.getPath('exe'),
    });

    minecraftAutoLauncher.isEnabled().then(function(isEnabled:boolean){
      if(isEnabled){
        minecraftAutoLauncher.disable();
      }else{
        minecraftAutoLauncher.enable();
      }
    }).catch(function(err:any){
      const LOG_PATH = path.join(app.getPath('logs'), 'logs');
      const logpath = path.join(LOG_PATH,'autoLunchLog/log.txt')
      fs.writeFileSync(logpath,err)
    });

  //minecraftAutoLauncher.disable();
    // app.setLoginItemSettings({
    //   openAtLogin: state,
    //   path: process.execPath,
    //   args: [],
    // });
    global.settingInfo.autoStart = state;
  });
};

//设置插件下载进度
export const setPluginDownload = (list:Record<string,any>)=>{
  global.pluginDownloadingList = list
}



// 快捷键设置
export const shortcutSetting = async (
  ipcMain: IpcMain
  // globalShortcut:GlobalShortcut,
) => {
  const setShortcut = async ({
    keys,
    type,
  }: {
    keys: string;
    type: string;
  }) => {
    console.log( keys, type,);

    if (!global.shortcutKeys) {
      global.shortcutKeys = {};
    }
    if (global.shortcutKeys[type]) {
      globalShortcut.unregister(global.shortcutKeys[type]);
    }
    global.shortcutKeys[type] = keys;

    globalShortcut.register(keys, () => {
      (global as any).mainWindow.webContents.send('openMenu', type);
    });
    return true;
  };
  ipcMain.handle(
    'setShortcut',
    (
      event: unknown,
      params: {
        keys: string;
        type: string;
      }
    ) => setShortcut(params)
  );
};
// 删除快捷键
export const shortcutRemove = async (
  ipcMain: IpcMain
  // globalShortcut:GlobalShortcut,
) => {
  const setShortcut = async ({
    type
  }: {
    type: string;
  }) => {
    console.log(type);
    if( global.shortcutKeys && global.shortcutKeys[type]){
      globalShortcut.unregister(global.shortcutKeys[type]);
      global.shortcutKeys[type] = ''
      console.log('global',global.shortcutKeys);

    }
    return true;
  };
  ipcMain.handle(
    'shortcutRemove',
    (
      event: unknown,
      params: {
        type: string;
      }
    ) => setShortcut(params)
  );
};
// 消息通知
export const notification = (ipcMain: IpcMain) => {
  const showNotification = (params:{title:string,body:string}) => {
    const silent = !global.isNoticeSound
    if (global.isNotice) {
      new Notification({ ...params,silent}).show();
    }
  };
  ipcMain.handle('notification', (event: unknown,params:{title:string,body:string}) => showNotification(params));
};
// 消息通知开关
export const triggerNotice = (ipcMain: IpcMain) => {
  const isOpenNotice = async (isOpen:boolean)=>{
    global.isNotice = isOpen
    return global.isNotice
  }
  ipcMain.handle('triggerNotice', (event: unknown,isOpen:boolean) => isOpenNotice(isOpen));
};
// 消息通知提示音开关
export const triggerNoticeSound = (ipcMain: IpcMain) => {
  const isOpenNoticeSound = async (isOpen:boolean)=>{
    console.log('isOpen',isOpen);
    global.isNoticeSound = isOpen
    return global.isNoticeSound
  }
  ipcMain.handle('triggerNoticeSound', (event: unknown,isOpen:boolean) => isOpenNoticeSound(isOpen));
};

// 获取缓存
export const getCache = async (app: App, ipcMain: IpcMain) => {
  const getCacheSize = async () => {
    const res = await global.mainWindow.webContents.session.getCacheSize();
    return formatBytes(res);
  };
  ipcMain.handle('getCacheSize', (event: unknown) => getCacheSize());
};

// 清理缓存
export const clearCache = async (app: App, ipcMain: IpcMain) => {
  const clearCacheInvoke = async () => {
    const res = await global.mainWindow.webContents.session.clearCache();
    console.log('clearCache',res);
    return true
  };
  ipcMain.handle('clearCache', (event: unknown) => clearCacheInvoke());
};

// 添加通信
export const pingNetWork=(url:string)=>{
  return new Promise((resolve)=>{
    internetAvailable({
      timeout: 5000,
      retries: 2,
      domainName: url,
      port: 53,
      host: 'CN' ? '114.114.114.114' : '8.8.8.8',
    }).then(() => {

      resolve(true)
      // return true
    })
    .catch(() => {
      resolve(false)
    });
  })

}



export const restart = (app:App,ipcMain:IpcMain)=>{
  const relaunch = async ()=>{
    app.relaunch()
    // app.quit()
    return true
  }
  ipcMain.handle('relaunch', (event: unknown) => relaunch());
}

export const getResoucesPath = (process:any,ipcMain:IpcMain,app:App)=>{
  const getApi = async ()=>{

    let configPath = ''
    let configJson:Record<string,any> = {}
    if(app.isPackaged){
      if(process.platform === 'darwin'){
        configPath = process.resourcesPath + '/app/resources/doctordesk/server.conf.json'
      }else{
        configPath = process.resourcesPath + '/app/resources/doctordesk/server.conf.json'
      }
      console.log('%c [ configPath ]-215', 'font-size:13px; background:pink; color:#bf2c9f;', configPath)
    }else{
      configPath = process.cwd() + '/resources/doctordesk/server.conf.json'
    }
    configJson = fs.readJSONSync(configPath)
    const info = configJson.api
    const apiInfo = info[info['currentNode']]
    global.apiInfo = apiInfo
    return configJson.api
  }
  ipcMain.handle('getApi', (event: unknown) => getApi());
}

export const setProcessListener = (ipcMain:IpcMain)=>{
  const setProcess = async (process:number,orderNo:string)=>{
    global[orderNo] = process
    return true
  }
  ipcMain.handle('setProcess', (event: unknown,process,orderNo) => setProcess(process,orderNo));
}

type AppPathType = 'home' | 'appData' | 'userData' | 'cache' | 'temp' | 'exe' | 'module' | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos' | 'recent' | 'logs' | 'crashDumps';
export const getAppPathListener = (app:App,ipcMain:IpcMain)=>{
  const getAppPath = (name:AppPathType)=>{
    return app.getPath(name);
  }
  ipcMain.handle('getAppPath', (event: unknown,name:AppPathType) => getAppPath(name));
}

//获取appname
export const getAppNameListener = (app:App,ipcMain:IpcMain)=>{
  const getAppName = ()=>{
    return app.getName();
  }
  ipcMain.handle('getAppName', () => getAppName());
}

// 获取各种版本
export const getVersion = (app:App)=>{
 let basepath = ''
 let restPath = ''
 if(app.isPackaged){
  basepath = process.resourcesPath
  restPath = '/app'
}else{
  basepath = process.cwd()
}
 const doctordeskpackage = basepath +restPath + '/resources/doctordesk/package.json'
 const dentalpackage  = basepath +restPath + '/resources/dental/package.json'
 const doctordeskConfig = basepath + restPath + '/resources/doctordesk/server.conf.json'
 const exepackage  = basepath +restPath + '/package.json'
 const doctordeskJson = fs.readJSONSync(doctordeskpackage)
 const dentalJson = fs.readJSONSync(dentalpackage)
 const exeJson = fs.readJSONSync(exepackage)
 const serverConfigJson = fs.readJSONSync(doctordeskConfig)
 return {
  exe:exeJson.version,
  dental:dentalJson.version,
  doctor:doctordeskJson.version,
  env:serverConfigJson.env.mode,
  basepath,
  exeJson
 }
}

// 获取各个模块版本
export const getVersionLister = (app:App,ipcMain:IpcMain)=>{
  const getAppName = ()=>{
    return getVersion(app)
  }
  ipcMain.handle('get-version', () => getAppName());
}

// 最大化窗口
export const setMaxWindow = (ipcMain:IpcMain)=>{
  const setMaxWindowInvoke = async ()=>{
    global.mainWindow.setFullScreen(true)
    global.mainWindow.webContents.send('max-window',true)
    return true
  }
  ipcMain.handle('setMaxWindow', async() => await setMaxWindowInvoke());
}
// 退出窗口最大化
export  const quitMaxWindow = (ipcMain:IpcMain)=>{
  const quitMaxWindowInvoke = async()=>{
    global.mainWindow.setFullScreen(false)
    global.mainWindow.webContents.send('quit-max-window',false)
    return false
  }
  ipcMain.handle('quitMaxWindow', async() => await quitMaxWindowInvoke());

}
// 最小化窗口
export const setMinWindow = (ipcMain:IpcMain)=>{
  const setMinWindowInvoke = ()=>{
    global.mainWindow.minimize()
  }
  ipcMain.handle('setMinWindow', () => setMinWindowInvoke());
}
// 关闭
export const closeWindow = (ipcMain:IpcMain)=>{
  const closeWindowInvoke = ()=>{
    global.mainWindow.close();
  }
  ipcMain.handle('closeWindow', () => closeWindowInvoke());
}

// 提供测试使用的打开控制台方法
export const registOpenTools=()=>{
  globalShortcut.register('CommandOrControl+O+T', () => {
    global.mainWindow.openDevTools()
  });
}

// 放大、缩小
export const registZoomInOrOut= () => {
  globalShortcut.register('CommandOrControl+=', () => {
    (global as any).mainWindow.webContents.send('setZoom', 'zoomIn');
  });
  globalShortcut.register('CommandOrControl+numadd', () => {
    (global as any).mainWindow.webContents.send('setZoom', 'zoomIn');
  });
  globalShortcut.register('CommandOrControl+0', () => {
    (global as any).mainWindow.webContents.send('setZoom', 'resetZoom');
  });
  globalShortcut.register('CommandOrControl+-', () => {
    (global as any).mainWindow.webContents.send('setZoom', 'zoomOut');
  });
  globalShortcut.register('CommandOrControl+numsub', () => {
    (global as any).mainWindow.webContents.send('setZoom', 'zoomOut');
  });
}


// // 打开渲染进程弹窗
// export const openDiyDialog = (ipcMain:IpcMain)=>{
//   const openDiyDialogInvoke = async(params:any)=>{
//     console.log(111,params);

//     global.mainWindow.webContents.send('openDiyDialog',params)
//     return 1111
//   }
//   ipcMain.handle('openDiyDialog', async(event:any, params) => await openDiyDialogInvoke(params));
// }
