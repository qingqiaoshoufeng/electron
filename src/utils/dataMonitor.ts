import * as fs from "fs";
import type {IpcMain} from 'electron';
import path from 'path';
import { submitBigFileUpload } from './upload_oss';
import _ from 'lodash'
const compressing = require('compressing');
const chokidar = require('chokidar');
export class dataMonitor{
  directoryList:string[]
  watchMap:Map<string,any>
  ipcMain:IpcMain
  fileList:Record<string,any>[]
  postfilelist:(fileList:Record<string, any>[])=>void
  constructor(ipcMain:IpcMain){
   this.directoryList = global.settingInfo.directoryList || []
   this.watchMap = new Map()
   this.ipcMain = ipcMain,
   this.fileList = []
   this.postfilelist = _.debounce((fileList:string)=>{
    console.log('****',fileList);
    (global as any).mainWindow.webContents.send('openDataMonitorDialog',fileList);
    this.fileList = []
  },3000)
  }
  // 开始监听
  startWatch(){
    if(this.directoryList.length){
      this.directoryList.forEach((item)=>{
        this.watchDirectory(item)
      })
    }
  }
  // 监听单个文件夹
  watchDirectory (path:string,isAdd?:false){
    if(!this.validate(path)&&isAdd) return
    const watchInstance = chokidar.watch(path,{
      usePolling:true,
      depth: 0,
      ignoreInitial:true
    })
    watchInstance.on('add',(fullPath:string)=>{
      const stat = fs.lstatSync(fullPath);
      const isDirec = stat.isDirectory();
      console.log(6666,isDirec,fullPath);
      if((fullPath)){
        this.postAddInfo(fullPath,isDirec)
      }
    })
    watchInstance.on('addDir',(fullPath:string)=>{
      const stat = fs.lstatSync(fullPath);
      const isDirec = stat.isDirectory();
      console.log(77777,isDirec,fullPath);
      if((fullPath&&isDirec)){
        this.postAddInfo(fullPath,isDirec)
      }
    })
    if(isAdd){
      this.directoryList.push(path)
      global.settingInfo.directoryList = this.directoryList
    }
    this.watchMap.set(path,watchInstance)
  }
  // 取消监听单个文件夹
  closeWatchDirectory (path:string){
    if(this.watchMap.has(path)){
      this.watchMap.get(path).close()
    }
    this.watchMap.delete(path)
    this.directoryList = this.directoryList.filter(item=>item!==path)
    global.settingInfo.directoryList = this.directoryList
  }
  validate(path:string){
		return !this.directoryList.some(item=>(item.includes(path)|| path.includes(item)))
	}
  postAddInfo(fullPath:string,isDirec:Boolean){
    const pathStringList = fullPath.split('/')
    const filename = pathStringList[pathStringList.length - 1]
    this.fileList.push({fullPath,path:filename,isDirec})
    console.log(path,3333);
    this.postfilelist(this.fileList)
  }
}

export const setMonitor = (ipcMain:IpcMain)=>{
  global.dataMonitorInstance =  new dataMonitor(ipcMain);
  (global.dataMonitorInstance as dataMonitor).startWatch()
}

export const deleteMonitor =(ipcMain:IpcMain)=>{
  const deleteMonitorInvoke = (path:string) => {
    (global.dataMonitorInstance as any).closeWatchDirectory(path)
  };
  ipcMain.handle('deleteMonitor', (event: unknown,path:string) => deleteMonitorInvoke(path));
}

//获取文件后缀名
function getExtension(fname:string) {
  var ext = path.extname(fname||'').split('.');
  return ext[ext.length - 1];
}

//上传扫描数据
export async function uploadScanFile(pathString:string,progress:(progress:number)=>void, callback:(res:any)=>void){
  const stat = fs.lstatSync(pathString);
  const is_direc = stat.isDirectory();
  let filepath
  console.log(222,filepath);

  if(is_direc){
    await compressing.zip.compressDir(pathString, `${pathString}.zip`)
    filepath = `${pathString}.zip`
    console.log(11111,`${pathString}.zip`);
  }else{
    filepath = pathString
  }
  const name = path.basename(filepath)
  const size = fs.statSync(filepath).size;
  const type = getExtension(filepath);
  let apiUrl;
  console.log(global.apiInfo,'444');
  let apiInfo = global.apiInfo
  if(apiInfo && apiInfo.url){
    apiUrl = apiInfo.url;
  }

  if(apiUrl.endsWith('/')){
    apiUrl = apiUrl.slice(0,apiUrl.length-1);
  }
  const uploadInfo = {
    // url: 'http://10.10.1.57:7000/oss/upload/authInfo',
    url: `${apiUrl}/oss/upload/authInfo`,
    filepath: filepath,
    fileName:name,
    fileSize:size,
    fileType:type,
    category: 'dentalFull',
    isPrivate: true
  }

  submitBigFileUpload(uploadInfo,progress).then(res => {
    callback(res);
  }).catch(err => {
    callback({status:'fail',msg:'网络请求失败',...global.apiInfo,...global.userInfo})
    console.log('err',err)
  })
}
// 绑定扫描文件监听

export const bindMonitorFile =(ipcMain:IpcMain)=>{
  const bindFile = (res:any)=>{
    console.log(res,555);
    (global as any).mainWindow.webContents.send('bindScanOrder',res)
  }
  ipcMain.handle('uploadMonitorFile', (event: unknown,path:string) => uploadScanFile(path,()=>{},bindFile));
}
