import { compressFolderSync } from '../utils/file';
import dgram, { Socket } from 'dgram';
import { ipcRenderer,app } from 'electron';
import fs from 'fs-extra';
import _ from "lodash";
import cmd from 'node-cmd';
import path from 'path';
import xml2js from 'xml2js';
import { serializeError } from 'serialize-error';
import { v4 as uuidv4 } from 'uuid'
import { submitBigFileUpload } from '../utils/upload_oss';
import { checkPath, downloadFile } from '../utils/download';
import { getPluginInfo } from './plugins'
import moment from 'moment'


const remote = process.type === 'browser' ? require('@electron/remote/main') : require('@electron/remote')
let cachePath :string;
let fileLoadPath : string;
let orderDir : string;
let uploadProgressCallback:(progress:number)=>void;
let requestResolve:(info:any)=>void;
let requestReject:(info:any)=>void;
let calibrateInfoCallback:(info:any)=>void;
let udpServeInitComplete:(info:any)=>void;

//获取缓存文件路径
const getCachepath = async()=>{
  let appname;
  if(process.type === 'browser'){
     appname = app.getName();
     cachePath = app.getPath('cache')
     fileLoadPath = global?.settingInfo?.fileLoadPath ?? '';
  }else{
     appname = await ipcRenderer.invoke('getAppName');
     cachePath =  await ipcRenderer.invoke('getAppPath','cache')
     fileLoadPath = remote.getGlobal('settingInfo').fileLoadPath;
  }
  if(fileLoadPath) cachePath =  fileLoadPath;
  orderDir = path.join(cachePath, `${appname}/facescan`);
}
getCachepath()

let UDPPORT = 61398;
let builder = new xml2js.Builder();
let xmlParser = new xml2js.Parser();
let server:Socket | null;

//唤起口扫软件进行扫描:
const faceScan = (orderNo: string, orderInfo: any ,modelCode:string,progressCallback:(progress:number)=>void ) => {
  return new Promise(async function (resolve, reject) {
    // if(server){
    //   reject({status:'fail',msg:'The software is busy'})
    //   alert(`The software is busy`);
    //   return;
    // }


    if(typeof progressCallback == 'function') {
      progressCallback(0)
      uploadProgressCallback = progressCallback;
    };

    requestResolve = resolve;
    requestReject = reject;

    const mouthModelUrl = _.get(orderInfo,`SnDentalOrder.mouthModelUrl`);
    delete orderInfo.SnDentalOrder.mouthModelUrl
    let filename = getFileName(orderNo,orderInfo);
    const cfgPath = path.join(orderDir,`faceScanCfg.cfg`);
    const xmlPath = path.join(orderDir, `${orderNo}/${filename}/${filename}.fsProject`);
    // const mouthFolderPath = path.join(orderDir, `${orderNo}/${filename}/MouthModel`);
    const mouthFolderPath = path.join(orderDir, `${orderNo}/${filename}`);


    //判断是否有口扫数据，若有则填充至面扫文件
    if(mouthModelUrl){
      const modelInfo  = await downloadScannedFile(mouthModelUrl,mouthFolderPath,`mouthModel.zip`);
      if(modelInfo.data.upper && modelInfo.data.lower){
        orderInfo.SnDentalOrder.FsExtraInfo.upperJawPath = './upper.beb';
        orderInfo.SnDentalOrder.FsExtraInfo.lowerJawPath = './lower.beb';
        // orderInfo.SnDentalOrder.FsExtraInfo.upperJawPath = modelInfo.data.upper;
        // orderInfo.SnDentalOrder.FsExtraInfo.lowerJawPath = modelInfo.data.lower;
      }
    }

    var xml = builder.buildObject(orderInfo); //将json转为xlm数据
    fs.removeSync(xmlPath); //移除文件
    fs.createFileSync(xmlPath); //重新创建文件
    fs.writeFileSync(xmlPath, xml); //向文件内写入xml数据
    //创建配置文件
    if(!fs.existsSync(cfgPath)){
      fs.writeJSONSync(cfgPath,{
        "UI": {
          "visibility": "FullScreen",
          "useCloud": false,
          "useOrderSystem": false,
          "trySkippingEditing": true,
          "hideAfterFinishing": true,
          "attachFilters": []
        }
      })
    }

    const plugin = await getPluginInfo(modelCode || 'facecan');
    console.log('%c [ plugin ]-98', 'font-size:13px; background:pink; color:#bf2c9f;', plugin)
    let softwarepath:string = plugin?.path;
    if(softwarepath?.length <= 0){
      console.log('%c [ softwarepath ]-58', 'font-size:13px; background:pink; color:#bf2c9f;', `该软件不存在，请至插件中心查看`)
      return;
    }


    try {
      startUdpServer(orderNo,filename); //开启监听
    } catch (error) {
      closeUdpServer();
      reject({status:'fail',msg:error})
    }



    //udp服务启动完成
    udpServeInitComplete = ()=>{
      let electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      console.log(`脚本命令：${electronRebuildCmd}`);
      cmd.run(electronRebuildCmd);
      // //接收标定信息
      // whetherToCalibrate(softwarepath, info => {
      //   console.log(`info.errorCode == `,info.errorCode);

      //   if(info.errorCode == 'unconnected'){
      //     alert(`您的设备未连接电脑，请先进行连接！`)
      //     requestReject({status:'fail',msg:'The device is not connected to the computer'})
      //     closeUdpServer();
      //     return;
      //   }
      //   console.log(`标定信息 == `,info)
      //   if(!info.expiredDate) info.expiredDate = 100
      //   //当已标定天数大约系统配置标定过期市场则提示建议进行标定
      //   if(info.expiredDate - info.days < 0){
      //     let res = confirm(`您已经超过${info.days}没有进行标定了，是否重新标定？`);
      //     if(res == true) {
      //         let calibrateCmd = `"${softwarepath}" --calibration "Calibration" --udpPort ${UDPPORT}`;
      //         console.log(`脚本命令：${calibrateCmd}`);
      //         cmd.run(calibrateCmd);
      //     }else{
      //         let electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      //         console.log(`脚本命令：${electronRebuildCmd}`);
      //         cmd.run(electronRebuildCmd);
      //     }
      //   }else{
      //     let electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      //      console.log(`脚本命令：${electronRebuildCmd}`);
      //      cmd.run(electronRebuildCmd);
      //   }
      // })
    }


  })

}

//判断是否需要校准
const whetherToCalibrate = (softwarepath:string,callback:(info:any)=>void) => {
  let calibrationInfoCmd = `"${softwarepath}" --calibrationInfo "calibrationInfo" --udpPort ${UDPPORT}`;
  console.log(`获取标定信息命令：${calibrationInfoCmd}`);

  calibrateInfoCallback = (res: any)=>{
    callback(res)
  }

  cmd.run(calibrationInfoCmd);
}

//开启udp服务
const startUdpServer = (orderNo:string,filename: string) => {

  if(!server){
    server = dgram.createSocket('udp4');
  }


  server.on('error', (err) => {
    const serialized = serializeError(err);
    console.log('%c [ mouthscan udp server err ] ', 'font-size:13px; background:pink; color:#bf2c9f;', serialized)
    if(serialized.code == "EADDRINUSE"){
      UDPPORT = UDPPORT + 1;
      console.log(`当前端口号 == `,UDPPORT)
      if(server) server.bind(UDPPORT,'127.0.0.1');
    }else{
      closeUdpServer()
    }
  });

  server.on('listening', () => {
    console.log('socket正在监听中...');
    udpServeInitComplete('init complete')
  });

  server.on('message', async (msg, rinfo) => {
    console.log(`receive message : ${msg.toString()} from ${rinfo.address}:${rinfo.port}`);
    let backInfo = JSON.parse(msg.toString());
    console.log(`backinfo == `,backInfo)
    if (backInfo.cmd === 'closed') {
      requestReject({status:'fail',msg:'The software is closed'})
      closeUdpServer();
    }

    if(backInfo.cmd === 'calibrationInfo'){
      calibrateInfoCallback(backInfo)
    }

    if(backInfo.cmd === 'busy'){
      requestReject({status:'fail',msg:'The software is busy'})
      alert(`The software is busy`);
      return;
    }

    if (backInfo.cmd === 'send') {
      console.log('扫描成功');
      // const exsitsSysbolFilePath = path.join(orderDir, `${orderNo}/oldOrder.json`);
      // fs.writeFileSync(exsitsSysbolFilePath, JSON.stringify({"filepath":path.join(orderDir,`${orderNo}/${filename}`),filename,orderNo:orderNo}))
      closeUdpServer();
      const scanner = await getsn(orderNo,filename);
      let filepath:string ;
      try {
        filepath = await archiveScanFile(orderNo,filename)
      } catch (error) {
        requestReject({status:'fail',msg:'Compression failure'});
        return;
      }
      if(typeof uploadProgressCallback == 'function') uploadProgressCallback(0.1);

      uploadScanFile(filepath,percent=>{
        if(percent == 0) percent = 1;
        if(typeof uploadProgressCallback == 'function') uploadProgressCallback(percent/100);
      },res=>{
        let data = Object.assign(res,scanner);
        const status = _.get(data,'status');
        if(status === 'fail'){
          requestReject({status:'fail',msg:data.msg ||'network err'});
        }else{
          requestResolve({status:'success',data});
        }
      });
    }

  });


  try {
    if(server) server.bind(UDPPORT,'127.0.0.1');
  } catch (error) {
    closeUdpServer()
    const serialized = serializeError(error);
    if(serialized.code == "ERR_SOCKET_ALREADY_BOUND"){
      startUdpServer(orderNo,filename)
    }
  }
}

const closeUdpServer = () => {
    if(server){
      server.close()
      server = null;
      console.log(`与软件端通信服务已关闭`);
    }
}


//获取文件后缀名
function getExtension(fname:string) {
  var ext = path.extname(fname||'').split('.');
  return ext[ext.length - 1];
}

//上传扫描数据
function uploadScanFile(filepath:string,progress:(progress:number)=>void, callback:(res:any)=>void){
  const name = path.basename(filepath)
  const size = fs.statSync(filepath).size;
  const type = getExtension(filepath);
  let apiUrl;

  const remote = process.type === 'browser'
  ? require('@electron/remote/main')
  : require('@electron/remote')
  let apiInfo = remote.getGlobal('apiInfo');
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
    callback({status:'fail',msg:'网络请求失败'})
    console.log('err',err)
  })
}

//获取设备序列号
async function getsn(orderNo:string,filename:string){
  const currentOrderFilesPath = `${orderDir}/${orderNo}/${filename}/fsproject`;
  const currentOrderProectPath = `${orderDir}/${orderNo}/${filename}/${filename}.fsProject`;
  let fsprojectData = await xmlParser.parseStringPromise(fs.readFileSync(currentOrderProectPath));
  const files = fs.readdirSync(currentOrderFilesPath);
  let uniqueInstallCode = remote.getGlobal('uniqueId');
  let uniqueUsageCode = uuidv4();
  let scanner = {scannerSerial:'',scannerModel:'',uniqueInstallCode,uniqueUsageCode,'localID': _.first(_.get(fsprojectData,`SnDentalOrder.ProjectGUID`))};
  files.forEach(fname => {
    var extname=path.extname(fname);
    if(extname.indexOf('pro') > -1){
      const scanJson = fs.readJSONSync(`${currentOrderFilesPath}/${fname}`);
      scanner.scannerSerial = scanJson.scannerSerial;
      scanner.scannerModel = scanJson.scannerModel;

    }

  });

  return scanner;

}
//清理无用数据
async function archiveScanFile(orderNo:string,fname: string){

  const currentOrderFilesPath = `${orderDir}/${orderNo}/${fname}`;
  // const blocklist = ['DebugData']
  // const files = fs.readdirSync(currentOrderFilesPath);
  // files.forEach(fname => {
  //   var extname=path.extname(fname);
  //   if(blocklist.some(function checknExt(ext){return extname.indexOf(ext) > -1})) {
  //     fs.removeSync(`${currentOrderFilesPath}/${fname}`)
  //   }
  // });


  try {
    await compressFolderSync(currentOrderFilesPath,`${orderDir}/${orderNo}/${fname}.zip`)
    return path.join(orderDir,`${orderNo}/${fname}.zip`)
  } catch (error) {
    console.log('[ 压缩出现错误 ] >', error)
    requestReject({status:'fail',msg:'compress fail'});
    throw error
  }

}


//获取文件命名
function getFileName(orderNo:string,orderInfo:any){
  // const exsitsSysbolFilePath = path.join(orderDir, `${orderNo}/oldOrder.json`);
  // if(fs.existsSync(exsitsSysbolFilePath)){
  //   const orderjson = fs.readJSONSync(exsitsSysbolFilePath)
  //   const filename = orderjson.filename;
  //   if(filename) return filename;
  // }

  var currenttime = moment(Date.now()).format('YYYYMMDDHHmmss');
  let fn = `${currenttime}-${orderInfo.SnDentalOrder?.Doctor?.DoctorName}-${orderInfo.SnDentalOrder?.Patient?.PatientName}`
  return fn;
}

//下载扫描文件
const downloadScannedFile = (downloadUrl:string,orderPath:string,fullname:string):Promise<{data:{upper:string,lower:string},status:string}> =>  {
  return new Promise((resolve, reject) => {

    downloadFile(downloadUrl,orderPath,fullname,percent=>{
      console.log(`下载进度 = ${percent}`);
    },(res:any)=>{
      if(res.status == 'success'){

        //解压下载的zip文件，过滤出上下颌文件
        let zipPath = res.data;
        const Admzip = require("adm-zip")
        const unzip = new Admzip(zipPath);
        unzip.extractAllTo(orderPath, true);

        //删除掉除上下颌模型外的其他文件
        let maxillary:any = {};
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

  })
}


export {
  faceScan
};

