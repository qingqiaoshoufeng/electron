import axios from 'axios';
import { app } from 'electron';
import path from 'path';
import type { IpcMain } from 'electron';
import { autoUpdater } from 'electron-updater';
import * as fs from 'fs'
import { downloadFile } from '../utils/download';
const copydir = require('copy-dir');


export class AllUpdate {
  loadUrl: string;
  updateDirPath: string;
  tempPath: string;
  name: string;
  updateParamsInfo: any;
  // targetPath: string
  constructor(loadUrl: string, name: string, updateParamsInfo: any) {
    // console.log(333,autoUpdater?.downloadedUpdateHelper?.cacheDir);
    autoUpdater.autoDownload = false;
    const updateDirPath = path.join(
      __dirname,
      '../../resources/dental/dist/statics'
    ); //更新目录
    const tempPath = path.join(app.getPath('cache'), `${app.getName()}/packages`); //临时下载包目录
    this.loadUrl = loadUrl;
    this.updateDirPath = updateDirPath;
    this.tempPath = tempPath;
    this.name = name;
    this.updateParamsInfo = updateParamsInfo;
    // this.targetPath = targetPath
  }

  // 下载资源
  downloadResouce = () => {
    return new Promise((resolve, reject) => {
      console.log(`下载信息=`,this.loadUrl, this.tempPath);
      downloadFile(this.loadUrl, this.tempPath,this.name,()=>{},(res:any)=>{
        console.log('%c [ res ]-49', 'font-size:13px; background:pink; color:#bf2c9f;', res)
        this.copySource();
        resolve(res)
      });      
    })
  };
  // 替换安装文件
  copySource() {
    const targetPath = path.join(this.tempPath, `/${this.name}`);
    console.log('%c [ targetPath ]-55', 'font-size:13px; background:pink; color:#bf2c9f;', targetPath)
    const targetResourcePath = path.join(this.updateDirPath, `/${this.name}`);
    console.log('%c [ targetResourcePath ]-57', 'font-size:13px; background:pink; color:#bf2c9f;', targetResourcePath)
    copydir.sync(targetPath, targetResourcePath, {
      utimes: true,
      mode: true,
      cover: true,
    });
    console.log('文件复制完成');
    
    // const unzip = new Admzip(this.targetPath);
    // unzip.extractAllTo(this.targetPath, true);
  }
  async autoUpdate() {
    // autoUpdater.setFeedURL(`http://localhost:${global.}/`)
    autoUpdater.checkForUpdates().catch((err) => {
      console.log('网络连接问题', err);
    });
  }
  //获取资源远端版本
  async getHashInfo() {

    let token, appID, baseUrl;
    let userInfo = global.userInfo;
    let apiInfo = global.apiInfo;
    if (typeof userInfo == 'string') {
      userInfo = JSON.parse(userInfo);
    }
    if (userInfo && userInfo.token) {
      token = userInfo.token;
    }

    if (typeof apiInfo == 'string') {
      apiInfo = JSON.parse(apiInfo);
    }
    if (apiInfo && apiInfo.appID) {
      appID = apiInfo.appID;
      baseUrl = apiInfo.url;
    }
    if(baseUrl.endsWith('/')) baseUrl = baseUrl.slice(0,baseUrl.length-1);

    const url = `${baseUrl}${'/plugin/hash/info'}`;

    const res: any= await axios.post(url, this.updateParamsInfo, {
      headers: {
        'Content-Type': 'application/json',
        'X-Auth-AppId': appID,
        'X-Auth-Token': token,
      },
    }).catch((err)=>{
      console.log(`获取yaml hash error == `,err);
    });

    console.log(`全量更信息 == `,res.data);

    if (
      res.data &&
      res.data.status === 'success' &&
      res.data.result
      // res.data.result &&
      // res.data.result.length
    ) {

      return res.data.result.hashValue // 数据改成数组
    } else {
      return null;
    }
  }
  generateYml(hash:string,version:string){
    const stringTem =`version: ${version}
files:
  - url: ${ this.name }
    sha512: ${hash}
    size: 259489712
path: ${ this.name }
sha512: ${hash}
releaseDate: '2022-12-30T09:28:19.459Z'`
    const ymlPath = path.join(this.updateDirPath,'/latest.yml')
    fs.writeFileSync(ymlPath, stringTem);
  };

}

export const handleUpdateAll = (ipcMain: IpcMain) => {
  const update = async (url: string, name: string, updateParamsInfo: any) => {
    return new Promise(async (resolve, reject) => {
      console.log(2222, name,updateParamsInfo);
      const update = new AllUpdate(url, name, updateParamsInfo);
      const hash = await update.getHashInfo() || ''
      console.log(`hash = `,hash);

      update.generateYml(hash,updateParamsInfo.softVersion)
      update.downloadResouce().then(()=>{
        console.log('下载完成并放入指定位置');
        resolve('更新完成')
      })
      // await update.downloadResouce();
      // console.log('下载完成并放入指定位置');
      // resolve('更新完成')
    })
  };

  console.log('[ 注册更新事件 ] >')
  ipcMain.handle(
    'UpdateAll',
    async (event: unknown, url: string, name: string, updateParamsInfo: any) =>
      await update(url, name, updateParamsInfo)
  );
};
