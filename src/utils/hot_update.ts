import { app } from 'electron';
import path from 'path';
import fs from 'fs-extra';
import type { IpcMain } from 'electron';
import * as copydir from 'copy-dir';
import { downloadFile } from '../utils/download';
import Admzip from 'adm-zip';

import logger from '../utils/logger';

const appname = app.getName();
const cachePath = app.getPath('cache')
const patchPackagePath = path.join(cachePath, `${appname}/packages/patchs`);


//通过loadUrl及modelCode进行热刷新
export const hotRefreshPatch = (ipcMain: IpcMain,)=>{
  const hotrefresh = (patchUrl:string,modelCode:string,fileName:string)=>{
    if(!fs.existsSync(patchPackagePath)) fs.mkdirpSync(patchPackagePath)
    console.log('[ patchPackagePath ] >', patchPackagePath)
    downloadFile(patchUrl, patchPackagePath,fileName,()=>{},(res:any)=>{
      console.log(`${fileName}更新文件下载完毕`, res.data)
    });

  }
  ipcMain.handle(
    'hotRefreshPatch',
    (event: unknown, patchUrl:string,modelCode:string,fileName:string) => hotrefresh(patchUrl,modelCode,fileName)
  );
}


export const updateResource = () => {
  const resoucePath = path.join(__dirname, '../../', `resources`); //项目目录
  const tempPath = patchPackagePath; //临时下载增量包目录
  const dentaltemppath = path.join(tempPath,'./dental.zip')
  const dentalresourcepath = path.join(resoucePath,'./dental.zip')

  const doctortemppath = path.join(tempPath,'./doctordesk.zip')
  const doctorresourcepath = path.join(resoucePath,'./doctordesk.zip')

  const doctordirresourcepath = path.join(resoucePath,'./doctordesk')
  const dentaldirresourcepath = path.join(resoucePath,'./dental')

  const isUpdateDental = fs.existsSync(dentaltemppath)
  const isUpdatedoctordesk = fs.existsSync(doctortemppath)
  logger.front(`isUpdateDental == ${isUpdateDental}`)
  logger.front(`isUpdatedoctordesk == ${isUpdatedoctordesk}`)

  logger.front(`dentaldirresourcepath = ${dentaldirresourcepath}`)
  logger.front(`doctorresourcepath = ${doctorresourcepath}`)


  if(isUpdateDental){
    fs.rmdirSync(dentaldirresourcepath, { recursive: true })
    logger.front(`删除dental文件夹 = ${dentaldirresourcepath}`)
    copydir.sync(dentaltemppath, dentalresourcepath, { utimes: true, mode: true, cover: true });
    fs.removeSync(dentaltemppath)
    try {
      const unzip = new Admzip(dentalresourcepath);
      unzip.extractAllTo(resoucePath, true);
      logger.front(`dental 更新完成`)
    } catch (error) {
      logger.front(`热更新unzip error == ${error}`)
    }
   

  }
  if(isUpdatedoctordesk){
      fs.rmdirSync(doctordirresourcepath, { recursive: true })
      logger.front(`删除dental文件夹 = ${doctordirresourcepath}`)
      copydir.sync(doctortemppath, doctorresourcepath, { utimes: true, mode: true, cover: true });
      fs.removeSync(doctortemppath)
      try {
        const unzip = new Admzip(doctorresourcepath);
        unzip.extractAllTo(resoucePath, true);
        logger.front(`doctordesk 更新完成`)
      } catch (error) {
        logger.front(`热更新unzip error == ${error}`)
      }
      
  }

};
