import { AxiosResponse } from 'axios'
import axios from 'axios'
import moment from 'moment'
import fs from 'fs-extra';
import md5 from 'md5'
import path from 'path';


// import type { UploadRequestOptions, UploadProgressEvent } from '@shining3d/xl-element-plus'
const OSS = require('ali-oss')
const AWS = require('aws-sdk')
const remote = process.type === 'browser'
  ? require('@electron/remote/main')
  : require('@electron/remote')
interface IFileInfo {
  url: string, // 上传地址
  filepath: string,
  fileName:string,
  fileSize:number,
  fileType:string,
  category: string,
  fileMd5?: string,
  isPrivate?: boolean
}
interface ISTS {
  AccessKeyId: string,
  AccessKeySecret: string
  Expiration: string
  SecurityToken: string
  regionID: string
  type: string
}
interface IUploadInfo {
  exist: boolean,
  bucket: string,
  chunkSize: number,
  dfsID: string,
  directURL: string,
  expires: number,
  stsInfo: ISTS,
}
interface IOssCheckPoint {
  doneParts: Array<{number: number, etag: string}>,
  file: string,
  fileSize: number,
  name: string,
  partSize: number,
  uploadId: string
}
interface IOssCheckPoints {
  [key: string]: IOssCheckPoint
}

let fileInfo = {} as IFileInfo
let uploadInfo = {} as IUploadInfo // 后端返回的上传信息，直传｜分片
let downloadUrl = '' // 文件下载地址
let uploadProcess:(process:number)=>void;//上传进度
let promiseResolve: (arg0: { downloadUrl: string; dfsID: string; bucket: string; fileName: string; }) => void
let promiseReject: (arg0: AxiosResponse<any, any>) => void

// let uploadProgress: UploadRequestOptions['onProgress'] // 上传进度回调函数

let ossClient: {
  multipartUpload: (arg0: string, arg1: string, arg2: {
    progress: (progress: any, checkpoint: IOssCheckPoint) => Promise<void>;
      parallel: number;
      partSize: number;
      timeout: number;
      headers: {
        'Content-Disposition': string
      };
      checkpoint?: unknown
  }) => Promise<any>;
  cancel: () => void
}
const ossCheckpoints :IOssCheckPoints = {}
let s3Client: {
  upload: (arg0: {
    Bucket: string // 存储桶名称
    Key: string // 文件名，重名会覆盖
    ContentType: string // 文件类型
    Body: string // 具体的文件路径
    'Access-Control-Allow-Credentials': string; ContentDisposition: string
  }, arg1: {
    queueSize: number // 并发数
    // partSize: 10 * 1024 * 1024, // uploadInfo.chunkSize,
    connectTimeout: number // 设置超时时间
  }) => { (): any; new(): any; on: { (arg0: string, arg1: (e: { loaded: string | number; total: string | number }) => void): any; new(): any } }; abortMultipartUpload: (arg0: { Bucket: string; Key: string; UploadId: string }, arg1: (err: { stack: any }, data: any) => void) => void
}
let s3Upload: { service?: any; send?: (arg0: (err: any, data: any) => void) => void }

//获取文件后缀名
function getExtension(filename:string) {
  var ext = path.extname(filename||'').split('.');
  return ext[ext.length - 1];
}

// 获取上传信息 直传｜分片
const getUploadInfo = async () => {
  const { url, category, fileMd5, filepath,fileSize,fileName,fileType, isPrivate } = fileInfo

  const name =  fileName || path.basename(filepath)
  const size = fileSize || fs.statSync(filepath).size;
  const type = fileType || getExtension(filepath);
  let token = '';
  let appID = '';
  let userInfo;
  let apiInfo;
 try {
  userInfo = remote.getGlobal('userInfo');
  apiInfo = remote.getGlobal('apiInfo');
 } catch (error) {
  userInfo = global.userInfo
  apiInfo = global.apiInfo
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

  return axios.post(url, {
    name,
    size,
    md5: fileMd5,
    category,
    contentType: type,
    private: isPrivate
  }, {
    headers: {
      'Content-Type': 'application/json',
      "X-Auth-AppId":appID,
      "X-Auth-Token":token
    }
  }).then((res: AxiosResponse) => {
    if (res.data.status === 'success') {
      uploadInfo = res.data.result
    } else {
      promiseReject(res)
    }
  }).catch(err => {
    promiseReject(err)
  })
}

const handleResolve = (downloadUrl = '') => {
  const { dfsID, bucket } = uploadInfo
  const name = fileInfo.fileName
  promiseResolve({ downloadUrl, dfsID, bucket, fileName: name })
}

// 上传进度 （直传 ｜ aws）
const originalUploadProgress = (e: { loaded: any; total: any }) => {
  // 处理原生进度事件
  const percent = +((+e.loaded / +e.total) * 100).toFixed(2)
  // const percent = +(+e.loaded / +e.total).toFixed(2)
  uploadProcess(percent)
}

// 文件下载时的名称-原始文件名
const getDownloadFileName = () => {
  const  name  = fileInfo.filepath
  const lastDot = name.lastIndexOf('.')
  const shortName = fileInfo.fileName.slice(0,fileInfo.fileName.lastIndexOf('.')) ;
  const fileName = encodeURIComponent(shortName) ||  encodeURIComponent(name.slice(0, lastDot))
  const fileExt = encodeURIComponent(name.slice(lastDot))
  // return `attachment;filename=${fileName}${fileExt};filename*=${fileName}${fileExt}`
  return `attachment;filename=${fileName}${fileExt}`
}

// 小于10M，根据返回的URL直传
const directUpload = (directUrl: string, fileArrayBuffer: string | ArrayBuffer | null | undefined) => {
  return axios.put(directUrl, fileArrayBuffer, {
    headers: {
      'Content-Disposition': getDownloadFileName(),
      'Content-Type': ''
    },
    onUploadProgress: originalUploadProgress
  }).then((res: AxiosResponse) => {
    if (res.status === 200) {
      const { dfsID } = uploadInfo
      downloadUrl = `https://timgcn.shining3d.com/${dfsID}`
      handleResolve(downloadUrl)
    }
  }).catch((err: AxiosResponse) => {
    console.log('directUpload failed === ', err)
    promiseReject(err)
  })
}

// 初始化 aliyun oss client
const initOSSClient = () => {
  const { stsInfo, bucket } = uploadInfo
  const { AccessKeyId, AccessKeySecret, SecurityToken, regionID } = stsInfo
  ossClient = new OSS({
    accessKeyId: AccessKeyId,
    accessKeySecret: AccessKeySecret,
    stsToken: SecurityToken,
    bucket,
    region: 'oss-' + regionID
    // secure: true
  })
}

// aliyun oss上传进度
const ossMultipartUploadProgress = async (progress:any, checkpoint: IOssCheckPoint) => {
  console.log(`${JSON.stringify(checkpoint)} 上传进度 ${progress}`)
  uploadProcess(progress*100)

  ossCheckpoints[checkpoint.uploadId as string] = checkpoint
  // 判断STS Token是否将要过期，过期则重新获取
  const { Expiration } = uploadInfo.stsInfo
  const timegap = 2
  if (Expiration && moment(Expiration).utc().subtract(timegap, 'minutes').isBefore(moment().utc())) {
    console.log(`STS token will expire in ${timegap} minutes，uploading will pause and resume after getting new STS token`)
    await ossMultipartCancel()
    await getUploadInfo()
    await ossMultipartResume()
  }
}

// aliyun oss分片上传配置
const getOssMultiparOptions = () => {
  return {
    progress: ossMultipartUploadProgress, // 上传进度
    parallel: 6, // 设置并发上传的分片数量。
    partSize: uploadInfo.chunkSize, // 设置分片大小。原始默认值为1 MB，最小值为100 KB。
    timeout: 60 * 1000 * 5, // 设置超时时间
    headers: {
      'Content-Disposition': getDownloadFileName() // 指定该Object被下载时的名称。
    }
  }
}

// aliyun oss分片上传，objectName : oss里面存储的对象名（文件名）
const ossMultipartUpload = async (objectName:string, filepath:string) => {
  if (!ossClient) {
    await initOSSClient()
  }
  return ossClient?.multipartUpload(objectName, filepath, getOssMultiparOptions()).then((res: any) => {
    downloadUrl = res.name ? `https://timgcn.shining3d.com/${res.name}` : ''
    handleResolve(downloadUrl)
  }).catch(async (err) => {
    console.log('ossMultipartUpload failed === ', err)
    if (err?.name !== 'cancel') {
      await ossMultipartResume()
    }
  })
}

// aliyun oss断点续传
const ossMultipartResume = () => {
  Object.values(ossCheckpoints).forEach((checkpoint: IOssCheckPoint) => {
    const { uploadId, file } = checkpoint
    return ossClient.multipartUpload(uploadId, file, {
      ...getOssMultiparOptions(),
      checkpoint
    }).then(result => {
      delete ossCheckpoints[checkpoint.uploadId]
      downloadUrl = result.name ? `https://timgcn.shining3d.com/${result.name}` : ''
      handleResolve(downloadUrl)
    }).catch(async (err: AxiosResponse) => {
      console.log('Resume multipart upload failed === ', err)
      await ossMultipartResume()
    })
  })
}

// aliyun oss取消上传
const ossMultipartCancel = () => {
  if (ossClient) ossClient?.cancel()
}

// aws分片上传
const awsMultipartUpload = async () => {
  const { stsInfo, bucket, dfsID } = uploadInfo
  const { AccessKeyId, AccessKeySecret, SecurityToken, regionID } = stsInfo
  const credentials = {
    accessKeyId: AccessKeyId,
    secretAccessKey: AccessKeySecret,
    sessionToken: SecurityToken
  }

  s3Client = new AWS.S3({ // AWS 认证相关
    region: regionID, // 'eu-central-1'
    credentials: credentials
  })

  const uploadParams = {
    Bucket: bucket, // 存储桶名称 测试用：'t3dpub'
    Key: dfsID, // 文件名，重名会覆盖
    ContentType: fileInfo.fileType, // 文件类型
    Body: fileInfo.filepath, // 具体的文件路径
    'Access-Control-Allow-Credentials': '*',
    ContentDisposition: getDownloadFileName()
  }
  const uploadOptions = {
    queueSize: 6, // 并发数
    // partSize: 10 * 1024 * 1024, // uploadInfo.chunkSize,
    connectTimeout: 60 * 1000 * 5 // 设置超时时间
  }

  s3Upload = s3Client.upload(uploadParams, uploadOptions).on('httpUploadProgress', originalUploadProgress)
  awsSendUpload(s3Upload)
}

const awsSendUpload = (s3Upload: any) => {
  s3Upload.send(function(err: any, data: any) {
    console.log('awsSendUpload data', data)
    if (err) {
      console.log('发生错误：', err.code, err.message)
      if (err.code === 'NoSuchUpload') {
        promiseReject(err)
      } else {
        awsSendUpload(s3Upload)
      }
    } else {
      downloadUrl = data.Location // 文件访问地址
      handleResolve(downloadUrl)
    }
  })
}

// aws取消上传
const awsMultipartCancel = () => {
  if (s3Client) {
    const { bucket, dfsID } = uploadInfo
    const { UploadId } = s3Upload?.service?.config?.params
    const params = {
      Bucket: bucket, // 存储桶名称 测试用：'t3dpub'
      Key: dfsID, // 文件名，重名会覆盖
      UploadId
    }
    s3Client.abortMultipartUpload(params, function (err: { stack: any }, data: any) {
      if (err) console.log('abortMultipartUpload err', err, err.stack) // an error occurred
      else console.log('abortMultipartUpload', data) // successful response
    })
  }
}

const submitBigFileUpload = (fileObj: IFileInfo,processCallback:(process:number)=>void) => {
  fileInfo = { ...fileObj }
  const { filepath } = fileObj
  uploadProcess = typeof processCallback == 'function' ? processCallback : function(){};
  return new Promise((resolve, reject) => {

    fs.readFile(filepath, async function(err, buf) {
      fileInfo.fileMd5 = md5(buf)
      promiseResolve = resolve
      promiseReject = reject

      await getUploadInfo()

      if (!uploadInfo) {
        reject(new Error())
        return
      }

      const { exist, directURL, dfsID } = uploadInfo
      uploadProcess(0)
      if (exist) {
        // 文件已存在 直接返回上传成功
        downloadUrl = `https://timgcn.shining3d.com/${dfsID}`
        uploadProcess(1)
        handleResolve(downloadUrl)
      } else if (directURL) {
        // 小文件直传
        console.log('directURL', directURL)
        await directUpload(directURL, fs.readFileSync(filepath))
      } else {
        // 大文件分片上传
        const { type } = uploadInfo?.stsInfo
        if (type === 'aws') {
          console.log('aws')
          await awsMultipartUpload()
        } else {
          // aliyun oss
          console.log('oss')
          await initOSSClient()
          await ossMultipartUpload(dfsID, filepath)
        }
      }


    });
  })
}

const cancelUpload = () => {
  const { type } = uploadInfo?.stsInfo
  if (type === 'aws') {
    awsMultipartCancel()
  }
  if (type === 'oss') {
    ossMultipartCancel()
  }
}

export { submitBigFileUpload, cancelUpload }
