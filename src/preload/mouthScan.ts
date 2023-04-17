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
import { compressFolderSync } from '../utils/file';
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
  orderDir = path.join(cachePath, `${appname}/mouthscan`);
}
getCachepath()

let UDPPORT = 61398;
let builder = new xml2js.Builder();
let xmlParser = new xml2js.Parser();
let server:Socket | null;

//唤起口扫软件进行扫描:
const mouthScan = (orderNo: string, orderInfo: any , modelCode:string, progressCallback:(progress:number)=>void ) => {
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

    let filename = getFileName(orderNo,orderInfo);

    const cfgPath = path.join(orderDir,`mouthScanCfg.json`);
    const xmlPath = path.join(orderDir, `${orderNo}/${filename}/${filename}.xml`);


    var xml = builder.buildObject(orderInfo); //将json转为xlm数据
    fs.removeSync(xmlPath); //移除文件
    fs.createFileSync(xmlPath); //重新创建文件
    fs.writeFileSync(xmlPath, xml); //向文件内写入xml数据

    //创建配置文件
    if(!fs.existsSync(cfgPath)){
      fs.writeJSONSync(cfgPath,{
        "UI":{
            "visibility":"FullScreen",
            "trySkippingEditing":"true"
        }
      })
    }
    console.log('[ modelCode ] >', modelCode)
    let plugin = await getPluginInfo( modelCode || 'newaoralscan_domestic');
    if(!plugin?.path) plugin = await getPluginInfo('newaoralscan');

    let softwarepath:string = plugin?.path;
    if(softwarepath?.length <= 0){
      console.log('%c [ softwarepath ]-58', 'font-size:13px; background:pink; color:#bf2c9f;', `该软件不存在，请至插件中心查看`)
      return;
    }




    startUdpServer(orderNo,filename); //开启监听


    //udp服务启动完成
    udpServeInitComplete = ()=>{
      const electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      console.log(`脚本命令：${electronRebuildCmd}`);
      cmd.run(electronRebuildCmd);

      // //接收标定信息
      // whetherToCalibrate(softwarepath, info => {
      //   if(info.errorCode == 'unconneced'){
      //     alert(`您的设备未连接电脑，请先进行连接！`)
      //     requestReject({status:'fail',msg:'The device is not connected to the computer'})
      //     closeUdpServer();
      //     return;
      //   }
      //   console.log(`标定信息 == `,info)
      //   if(!info.expiredDate) info.expiredDate = 100
      //   //当已标定天数大约系统配置标定过期市场则提示建议进行标定
      //   let electronRebuildCmd : string;//脚本字符串
      //   if(info.expiredDate - info.days < 0){
      //     let res = confirm(`您已经超过${info.days}没有进行标定了，是否重新标定？`);
      //     if(res == true) {
      //       electronRebuildCmd = `"${softwarepath}" --calibration "Calibration" --udpPort ${UDPPORT}`;
      //     }else{
      //       electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      //     }
      //   }else{
      //     electronRebuildCmd = `"${softwarepath}" --source "DoctorAssist" --order "${xmlPath}" --cfg "${cfgPath}" --udpPort ${UDPPORT}`;
      //   }
      //   console.log(`脚本命令：${electronRebuildCmd}`);
      //   cmd.run(electronRebuildCmd);
      // })
    }

  })

}

//判断是否需要校准
const whetherToCalibrate = (softwarepath:string,callback:(info:any)=>void) => {
  let calibrationInfoCmd = `"${softwarepath}" --calibrationInfo "CalibrationInfo" --udpPort ${UDPPORT}`;
  console.log(`获取标定信息命令：${calibrationInfoCmd}`);

  calibrateInfoCallback = (res: any)=>{
    callback(res)
  }

  cmd.run(calibrationInfoCmd);

  //当设备已标定时间-标定保质期大于0的话则需重新标定
  // return dat.expiredDate - dat.days > 0
  // {
  //   cmd:”calibrationInfo ”,
  //   days:30,//距设备上次标定的时间
  //   expiredDate:30,//扫描软件中配置的标定保质期
  //   errorCode：“”//默认为空,“unconneced”：设备未连接，时间无效
  // }
}

//开启udp服务并监听
const startUdpServer = (orderNo:string, filename: string) => {
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
    if (backInfo.cmd === 'closed') {
      requestReject({status:'fail',msg:'The software is closed'})
      closeUdpServer();
    }

    if(backInfo.cmd === 'calibrationInfo '){
      calibrateInfoCallback(backInfo)
    }

    if(backInfo.cmd === 'busy'){
      requestReject({status:'fail',msg:'The software is busy'})
      alert(`The software is busy`);
      return;
    }

    if (backInfo.cmd === 'send') {
      console.log('扫描成功');
      const exsitsSysbolFilePath = path.join(orderDir, `${orderNo}/oldOrder.json`);
      fs.writeFileSync(exsitsSysbolFilePath, JSON.stringify({"filepath":path.join(orderDir,`${orderNo}/${filename}`),filename,orderNo:orderNo}))
      closeUdpServer();
      const scanner = await getsn(orderNo,filename);
      const filepath = await archiveScanFile(orderNo,filename);
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

  console.log(`当前端口号 == `,UDPPORT)
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
async function getsn(orderNo:string,finaname:string){
  const currentOrderFilesPath = `${orderDir}/${orderNo}/${finaname}/project`;
  const currentOrderProectPath = `${orderDir}/${orderNo}/${finaname}/${finaname}.inProject`;
  const files = fs.readdirSync(currentOrderFilesPath);
  let fsprojectData = await xmlParser.parseStringPromise(fs.readFileSync(currentOrderProectPath));
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
  const whitelist = ['beb','xml','inProject','dentalProject','modelCaptures']
  const files = fs.readdirSync(currentOrderFilesPath);
  files.forEach(fname => {
    var extname=path.extname(fname);

    if(!whitelist.some(function checknExt(ext){return extname.indexOf(ext) > -1})) {
      fs.removeSync(`${currentOrderFilesPath}/${fname}`)
    }

  });

  try {
    await compressFolderSync(currentOrderFilesPath,`${currentOrderFilesPath}.zip`)
    return `${currentOrderFilesPath}.zip`;
  } catch (error) {
    console.log('[ 压缩出现错误 ] >', error)
    requestReject({status:'fail',msg:'compress fail'});
    throw error
  }
}

//获取文件命名
function getFileName(orderNo:string,orderInfo:any){
  const exsitsSysbolFilePath = path.join(orderDir, `${orderNo}/oldOrder.json`);
  if(fs.existsSync(exsitsSysbolFilePath)){
    const orderjson = fs.readJSONSync(exsitsSysbolFilePath)
    const filename = orderjson.filename;
    if(filename) return filename;
  }

  var currenttime = moment(Date.now()).format('YYYYMMDDHHmmss');
  let fn = `${currenttime}-${orderInfo.SnDentalOrder?.Doctor?.DoctorName}-${orderInfo.SnDentalOrder?.Patient?.PatientName}`
  return fn;
}

export {
  mouthScan
};

