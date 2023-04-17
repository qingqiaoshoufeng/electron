import { autoUpdater } from 'electron-updater';
import { IpcMain } from "electron";
import logger from './logger'
import path from 'path';
import fs from 'fs-extra';
import yaml from 'js-yaml';


function Message(type: number, data?: any) {
  const sendData = {
    type,
    data,
  };
  (global as any).mainWindow.webContents.send('updateMessageInfo', sendData);
}


const checkUpdateAll = (ipcMain:IpcMain)=>{

  const checkForUpdateInvoke = async ()=>{
    await autoUpdater.checkForUpdates().catch(err => {
      console.log('网络连接问题', err)
    })
  }
  ipcMain.handle('check-update-all', async (event: unknown) =>await checkForUpdateInvoke());
}

//本地是否存在最新的全量安装包
const existLatestFullPackage = (ipcMain:IpcMain)=>{
  const existLatestFullPackage = async ()=>{
    const updateDirPath = path.join(
      __dirname,
      '../../resources/dental/dist/statics'
    ); //更新目录
      
    const files = fs.readdirSync(updateDirPath);
    const ymlFiles = files.filter((file)=>{
      return file.endsWith('.yml')
    })

    if(ymlFiles.length > 0){
      try {
        const yname = ymlFiles[0];
        const fileContent = fs.readFileSync(path.join(updateDirPath,yname),'utf8');
        const data = yaml.load(fileContent);
        const exeFilePath = path.join(updateDirPath,data.path);
        //判断安装文件是否已经存在
        if(fs.existsSync(exeFilePath)){
          return data;
        }else{
          return null
        }
      } catch (error) {
        return null
      }
      
    }else{
      return null
    }
  }
  ipcMain.handle('existLatestFullPackage', async (event: unknown) =>await existLatestFullPackage());
}

const confirmUpdate = (ipcMain:IpcMain)=>{
  const confirmUpdateInvoke = async ()=>{
    await autoUpdater.quitAndInstall()
  }
  ipcMain.handle('confirm-update', async(event: unknown) => {
    await confirmUpdateInvoke()
  });
}

const confirmDownloadUpdate = (ipcMain:IpcMain)=>{
  const checkForUpdatesInvoke = async ()=>{
    await autoUpdater.downloadUpdate()
  }
  ipcMain.handle('confirm-downloadUpdate', async(event: unknown) =>await checkForUpdatesInvoke());
}


export default (ipcMain:IpcMain) => {
  // 在下载之前将autoUpdater的autoDownload属性设置成false，通过渲染进程触发主进程事件来实现这一设置(将自动更新设置成false)
  autoUpdater.autoDownload = false
  autoUpdater.setFeedURL(`http://localhost:${global.dentalServerPort}/statics`)
  autoUpdater.on('error', (err) => {
    logger.front('更新出现错误');
    logger.front(JSON.stringify(err));
      if (err.message.includes('sha512 checksum mismatch')) {
          Message(-1, 'sha512校验失败')
      }
  })
  // 当开始检查更新的时候触发
  autoUpdater.on('checking-for-update', () => {
    logger.front('开始检查更新');
      Message( 0)
  })
  // 发现可更新数据时
  autoUpdater.on('update-available', (event, arg:any) => {
    logger.front('有更新',arg);
     Message( 1)
  })
  // 没有可更新数据时
  autoUpdater.on('update-not-available', () => {
    logger.front('没有更新');
      Message( 2)
  })
  // 下载监听
  autoUpdater.on('download-progress', (progressObj) => {
      Message( 3, progressObj)
  })
  // 下载完成
  autoUpdater.on('update-downloaded', () => {
      logger.front('下载完成');
      logger.front(autoUpdater.downloadedUpdateHelper.cacheDir)
      // autoUpdater.downloadedUpdateHelper
      Message( 4)
  })
  //本地是否存在最新安装包
  existLatestFullPackage(ipcMain)
  // 执行更新检查
  checkUpdateAll(ipcMain)
  // 退出并安装
  confirmUpdate(ipcMain)
  // 手动下载更新文件
  confirmDownloadUpdate(ipcMain)
}
