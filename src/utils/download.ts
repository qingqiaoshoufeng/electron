//文件下载
import fs from 'fs-extra';
import path from 'path';
import request from 'request';
import progress from 'progress-stream';

const Tasks:any[] = [];



//检查路径个是否存在，若不存在并确认是否创建
const checkPath = (dir:string,generated:boolean)=>{
  if (!fs.existsSync(dir)) {
    if(generated){
      console.log('创建文件路径 == ',dir);
      fs.mkdirpSync(dir);
      return true;
    }else{
      return false;
    }
  } else {
    return true;
  }
}

/* 获取文件大小 */
function getUrlFileSize(url:string) {
	return new Promise(r => {
    const https = require("https")
    const http = require("http")
		let h = { http, https }
    console.log('url == ',url);
		let isHttps = url.indexOf("https") != -1
		h[isHttps ? "https" : "http"].get(url, {
			rejectUnauthorized: false
		}, (res:any) => {
			r(res.headers['content-length'])
		})
	})
}

/* 设置下载进度 */
async function setDownloadProgress(url:string,per:( process:number ) => void) {
	let p = progress({
    length: await getUrlFileSize(url),
    time: 500
  })
  p.on('progress', (progress:any) => {
    per(progress.percentage/100)
  });
  return p
}

//下载文件
async function downloadFile(url:string,output:string,filename:string,process:( process:number ) => void,callbak:(data:any)=>void){
  console.log(`下载任务开始`);
  if(!filename){
    filename = url.split('/').pop() || 'temp';
  }
  const exsit = checkPath(output,true);
  if( exsit ){

    let stream = fs.createWriteStream(path.join(output, filename));
    let p = await setDownloadProgress(url,process)
    let requestTask =  request(url).pipe(p).pipe(stream).on("close", function (err:any) {
      if(err)  throw err;
      if( fs.existsSync(path.join(output,filename)) ){
        console.log(`${filename}文件下载完毕`);
        callbak( {status:'success',data:path.join(output,filename)} );
      }else{
        callbak( {status:'fail',msg:'download fail'} );
      }

    });

    requestTask.url = url;
    requestTask.output = output;
    requestTask.filename = filename;

    Tasks.push(requestTask)
  }
}
// 关闭请求
const closeDownloadTask = (url:string,callbak:(data:any)=>void)=>{
  console.log('%c [ Tasks ]-105', 'font-size:13px; background:pink; color:#bf2c9f;', Tasks)

  for (let i = Tasks.length - 1; i >= 0; i--) {
    let req = Tasks[i];
    if(req.url === url){
      req.close();
      fs.removeSync(path.join(req.output,req.filename));//移除已下载文件
      callbak( {status:'success',msg:'task is closed'} );
      Tasks.splice(req, 1);
    }
  }
  console.log('%c [ Tasks ]-105', 'font-size:13px; background:pink; color:#bf2c9f;', Tasks)
}


//copy 到 指定路径
const copy2dir = (dir:string,target:string)=>{
  var copydir = require('copy-dir');
	copydir.sync(dir, target, {utimes: true,mode: true,cover: true});
}

export  { downloadFile, copy2dir , checkPath ,closeDownloadTask};
