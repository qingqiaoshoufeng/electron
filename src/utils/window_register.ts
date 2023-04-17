import { app, BrowserWindow ,ipcMain, dialog, webContents, BrowserView} from 'electron';
import path from 'path';
import { loadWebPage } from './load_page';
import { setRender, getRenderIDByName } from './render_store';
import { openFile,selectedscanUploadFile } from './openFile'

//展示loading
const showLoading = () => {
  let splashWindow = new BrowserWindow({
    closable:false,
    frame: false, // 无边框（窗口、工具栏等），只包含网页内容
    width: 800,
    alwaysOnTop:true,
    resizable: false,
    transparent: true, // 窗口是否支持透明，如果想做高级效果最好为true
    webPreferences: {
      devTools:false
    },
  });


  const loadingURL = path.join( __filename, `../../../resources/loading.html`);
  console.log('%c [ loadingURL ]-25', 'font-size:13px; background:pink; color:#bf2c9f;', loadingURL)
  splashWindow.loadURL(loadingURL);

  return splashWindow;
 };


// 注册创建新窗口监听
export const registerCreateWindowListener = (name: string, arg = { url: '' },compete:() => void) => {
  const productWinId = getRenderIDByName(name);
  if (productWinId) {
    const productWin = BrowserWindow.fromId(productWinId);
    if (productWin) {
      if (productWin.isMinimized()) productWin.restore();
      productWin.focus();
      return productWinId;
    }
  }
  // console.log(333,process.platform)
  const restParams = process.platform === 'darwin' ? {
    titleBarStyle: 'hiddenInset',
  } : {
     frame:false,
  }

  const splashWindow = showLoading();
  const winConfig:any = {
    width: 1300,
    height: 800,
    show:false,
    // frame:false,
    // titleBarStyle: 'hiddenInset',
    // titleBarStyle: 'hidden',-webkit-app-region: drag;
    webPreferences: {
      nodeIntegration: true,
      enableRemoteModule: true,
      webviewTag:true,
      contextIsolation: true,
      useContentSize: true,
      preload: app.isPackaged
        ? path.join(__dirname, 'preload.js')
        : path.join(__dirname, '../../.erb/dll/preload.js'),
    },
    ...arg,
    ...restParams
  };

  const url = winConfig.url || '';
  let newwin: BrowserWindow | null = null;
  newwin = new BrowserWindow(winConfig);
  (global as any).mainWindow = newwin
  const remoteMain = require('@electron/remote/main');
  remoteMain.enable(newwin.webContents);

  if(name === app.getName())   (global as any).mainWindow = newwin;
  if (url.startsWith('http') || url.startsWith('file')) {
    newwin.loadURL(url);
    compete()
  } else if (url.startsWith('.') || url.startsWith('/')) {
    newwin.loadFile(url);
    compete()
  } else {
    loadWebPage(newwin, url,()=>{},()=>{
      compete()
    });
  }
  setRender(name, { id: newwin.id, name }); // 存储子进程
  newwin.on('closed', () => {
    newwin = null;
    setRender(name, { id: null, name }); // 存储子进程
  });
  openFile(app,ipcMain,dialog,newwin)
  selectedscanUploadFile(app,ipcMain,dialog,newwin)

  newwin.once('ready-to-show',()=>{
    splashWindow.destroy()
    newwin?.show()
  })
  return newwin.id;
};


