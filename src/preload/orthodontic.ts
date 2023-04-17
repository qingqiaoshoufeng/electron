import { ipcRenderer,app } from 'electron';
import fs from 'fs-extra';
import _ from "lodash";
import cmd from 'node-cmd';
import path from 'path';
import { getPluginInfo } from './plugins'
import { AxiosResponse } from 'axios'
import axios from 'axios'
import { checkPath, downloadFile } from '../utils/download';
import moment from 'moment'

const remote = process.type === 'browser' ? require('@electron/remote/main') : require('@electron/remote')
let cachePath : string;
let fileLoadPath : string;
let orthodonticDir : string;
const getCachepath = async()=>{
  let appname;
  if(process.type === 'browser'){
     appname = app.getName();
     cachePath = app.getPath('cache')
     fileLoadPath = global?.settingInfo?.fileLoadPath ?? '';
  }else{
     appname = await ipcRenderer.invoke('getAppName');
     cachePath =  await ipcRenderer.invoke('getAppPath','cache');
     fileLoadPath = remote.getGlobal('settingInfo').fileLoadPath;
  }
  if(fileLoadPath) cachePath =  fileLoadPath;
  orthodonticDir = path.join(cachePath, `${appname}/orthodontic`);
  checkPath(orthodonticDir,true)
}
getCachepath()

let UDPPORT = 61398;

//唤起正畸软件进行正畸操作:
const orthodontic =  (patientId: string, orderInfo: any,modelCode:string ) => {
  return new Promise(async function (resolve, reject) {
    const orderPath = path.join(orthodonticDir,`${patientId}`);;
    const cfgPath = path.join(orthodonticDir,`${patientId}/orthodonticCfg.json`);

    console.log('[ cfgPath ] >', cfgPath)
    console.log('%c [ orderInfo ]-36', 'font-size:13px; background:pink; color:#bf2c9f;', orderInfo)

    const ulInfo:any = await downloadScannedFile(patientId, orderInfo,orderPath);

    var currenttime = moment(Date.now()).format('YYYYMMDDHHmmss')


    // UDPPORT = await detectPort(UDPPORT);
    const savePath = path.join(orderPath,currenttime);
    fs.mkdirpSync(savePath)
    orderInfo.clondPort = UDPPORT;
    orderInfo.savePath = savePath;
    orderInfo.upperPath = ulInfo.data.upper;
    orderInfo.lowerPath = ulInfo.data.lower;

    //设置两条假数据
    // orderInfo.doctorID = 'cdb91c01-7652-586e-84b3-495cfa4e7715';
    // orderInfo.hospitalID = '28860e67-f7ae-568f-96d3-81da2f67a1a3';


    delete orderInfo.upper;
    delete orderInfo.lower;
    //创建配置文件
    if(!fs.pathExistsSync(orderPath)) fs.mkdirpSync(orderPath)
    if(!fs.existsSync(cfgPath)) fs.writeJSONSync(cfgPath,orderInfo)

    console.log('[ modelCode ] >',modelCode )
    const plugin = await getPluginInfo(modelCode || 'OrthoSim');

    let softwarepath:string = plugin?.path ?? null;
    if(!softwarepath){
      return resolve({status:'fail',msg:'该软件不存在，请至插件中心查看'});
    }

    let summonSoftwareCmd = `"${softwarepath}" --configJsonPath "${cfgPath}" --startWay clond`;
    console.log(`脚本命令：${summonSoftwareCmd}`);

    cmd.run(summonSoftwareCmd);
  })

}
//下载扫描文件
const downloadScannedFile = (patientId: string, orderInfo: any ,orderPath:string) => {
  return new Promise((resolve, reject) => {
    let userInfo, apiInfo, token, appID ;
    if(process.type == 'browser'){
      userInfo = global.userInfo;
      apiInfo = global.apiInfo;
    }else{
      userInfo = remote.getGlobal('userInfo');
      apiInfo = remote.getGlobal('apiInfo');
    }


    if(typeof userInfo == 'string'){
      userInfo = JSON.parse(userInfo)
    }
    if(userInfo && userInfo.token){
      token = userInfo.token;
    }

    if(typeof apiInfo == 'string'){
      apiInfo = JSON.parse(apiInfo)
    }
    if(apiInfo && apiInfo.appID){
      appID = apiInfo.appID;
    }

    let apiUrl = apiInfo.url
    if(apiUrl.endsWith('/')){
      apiUrl = apiUrl.slice(0,apiUrl.length-1);
    }
    return axios.post(`${apiUrl}/u/dental/order/full/down`, {
      attachIDs:[orderInfo.upper.id,orderInfo.lower.id]
    }, {
      headers: {
        'Content-Type': 'application/json',
        "X-Auth-AppId":appID,
        "X-Auth-Token":token
      }
    }).then((res: AxiosResponse) => {
      if (res.data.status === 'success') {
        res.data.result.forEach((attach:any)=>{
          const { downLoadURL } = attach;
          console.log('%c [ attach ]-117-「orthodontic」', 'font-size:13px; background:#111fd7; color:#5563ff;', attach)
          if(checkPath(orderPath,true)){
            const fullname = `${patientId}.zip`;

            downloadFile(downLoadURL,orderPath,fullname,percent=>{
              console.log(`下载进度 = ${percent}`);
            },(res:any)=>{
              if(res.status == 'success'){

                //解压下载的zip文件，过滤出上下颌文件
                let zipPath = res.data;
                const Admzip = require("adm-zip")
                const unzip = new Admzip(zipPath);
                unzip.extractAllTo(orderPath, true);

                //删除掉除上下颌模型外的其他文件
                let maxillary = {};
                const files = fs.readdirSync(orderPath);
                files.forEach(filename => {
                  const lowerFilename = filename.toLocaleLowerCase();
                  const ext = path.extname(filename);
                  //过滤upper、lower文件
                  if(lowerFilename.indexOf('upper') > -1){
                    fs.renameSync(path.join(orderPath,filename),path.join(orderPath,`upper${ext}`))
                    maxillary['upper'] = path.join(orderPath,`upper${ext}`);
                  }else if(lowerFilename.indexOf('lower') > -1){
                    fs.renameSync(path.join(orderPath,filename),path.join(orderPath,`lower${ext}`))
                    maxillary['lower'] = path.join(orderPath,`lower${ext}`);
                  }else{
                    //config文件不要删除
                    fs.removeSync(path.join(orderPath,filename))
                  }
                });

                resolve({status: 'success',data:maxillary})
              }else{
                reject(res)
              }
            })
          }
        })
      } else {
        console.log('出现错误',res);

      }
    }).catch(err => {
      console.log('出现错误',err);
    })

  })
}




export {
  orthodontic
};

