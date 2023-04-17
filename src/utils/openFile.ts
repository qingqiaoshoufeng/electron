import type { App, IpcMain, Dialog, BrowserWindow } from 'electron';
import {} from '../utils/dataMonitor'
export const openFile = async (
  app: App,
  ipcMain: IpcMain,
  dialog: Dialog,
  win: BrowserWindow
) => {
  const openFileDialog = async ({oldPath='',type}:{oldPath:string,type:string}) => {
    console.log('*********',oldPath,type)
    let title = type === 'dataMonitor' ? '选择监控文件夹' : '选择保存位置'
    if (!win) return oldPath;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      title: title,
      properties: ['openDirectory', 'createDirectory'],
      defaultPath: oldPath,
    });
    if(type === 'dataMonitor'){
      console.log(11111,type);

      global.settingInfo[type] = !canceled ? filePaths[0] : oldPath;
      if(!canceled){
       ( global.dataMonitorInstance as any).watchDirectory(filePaths[0],true)
      }
      return !canceled ? filePaths[0] : oldPath;
    }
    global.settingInfo[type] = !canceled ? filePaths[0] : oldPath;
    return !canceled ? filePaths[0] : oldPath;
  };
  ipcMain.handle('openFileDialog', (event: unknown, params:{oldPath:string,type:string}) =>
    openFileDialog(params)
  );
};


export const selectedscanUploadFile = async (
  app: App,
  ipcMain: IpcMain,
  dialog: Dialog,
  win: BrowserWindow
) => {
  const selectedscanUploadFileInvoke = async ({oldPath='',type}:{oldPath:string,type:string}) => {
    if (!win) return oldPath;
    const { canceled, filePaths } = await dialog.showOpenDialog(win, {
      properties: ['openFile', 'openDirectory'],
      defaultPath: oldPath,
    });
    return !canceled ? filePaths[0] : oldPath;
  };
  ipcMain.handle('selectedscanUploadFile', (event: unknown, params:{oldPath:string,type:string}) =>
    selectedscanUploadFileInvoke(params)
  );
};




