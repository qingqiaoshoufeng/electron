import detectPort from 'detect-port';
const fs = require('fs-extra');
const { BrowserWindow } = require('electron');
const path = require('path');
const Admzip = require('adm-zip');
const copydir = require('copy-dir');
const logger = require('./logger');
const pm2 = require('./pm/index');
const { setRender, getRenderIDByName } = require('./render_store');


// 获取pm2配置文件中的默认端口号
const defaultPort = (cfgpath:any) => {
  const pm2Conf = fs.readFileSync(cfgpath, 'utf-8');
  const regex = /port(.+?),/g;
  const regArr = pm2Conf.match(regex);
  let portStr = '';
  if (regArr !== null && regArr.length >= 1) {
    portStr = regArr[0].replace(',', '');
    portStr = portStr.replace('port:', '');
  }
  portStr = portStr.trim();

  return portStr ? parseInt(portStr, 10) : undefined;
};

// 删除路径下所有文件
function deleteall(apath:string) {
  let files = [];
  if (fs.existsSync(apath)) {
    files = fs.readdirSync(apath);
    files.forEach((file:string) => {
      const curPath = `${apath}/${file}`;
      if (fs.statSync(curPath).isDirectory()) {
        // recurse
        deleteall(curPath);
      } else {
        // delete file
        fs.unlinkSync(curPath);
      }
    });
    fs.rmdirSync(apath);
  }
}

// 检查项目是否存在
const checkUnzipItemExists = (projectPath:string, productName:string) => {
  console.log('projectPath == ',projectPath);
  if (
    fs.existsSync(projectPath) &&
    !fs.existsSync(`${projectPath}/package.json`)
  ) {
    deleteall(projectPath);
  }

  if (!fs.existsSync(projectPath)) {
    if (fs.existsSync(`${projectPath}.zip`)) {
      const unzip = new Admzip(`${projectPath}.zip`);
      unzip.extractAllTo(path.join(projectPath, `../`), true);
    } else {
      logger.system(`项目路径=${projectPath}`);
      logger.system(`${productName}该项目路径不存在，且无zip包，请检查项目`);
      return false;
    }
  }

  return true;
};

//在window上加载url
function loadUrl(win:any, url:string,productName:string,compete:() => void) {
  logger.system(`${productName} 开始第${global.loadFailCount+1}次渲染 渲染地址：${url} win:${win}`);
  global.loadFailCount++
  win.loadURL(url).then((res:string) => {
    logger.system(`${productName} 网页已经渲染`);
    global.loadFailCount = 0;
    compete()
  }).catch((e:string) => {
    logger.system(`网页加载失败${e || ''}`);
    if(global.loadFailCount >=3){
      pm2.restartByName(productName);
      global.loadFailCount = 0;
    }
    setTimeout(() => {
      loadUrl(win, url,productName,compete);
    }, 1500);
  });
}

// 加载web页面
export async function loadWebPage(win:any, productName:string,callback:(port:number)=> void,compete:() => void) {
  let dPort = 3000;
  const projectPath = path.join( __filename, `../../../resources/${productName}`);
  const pm2configpath = `${projectPath}/config/default.js`;

  const projectExist = checkUnzipItemExists(projectPath, productName);
  if (!projectExist) return; // 项目路径不存在且无压缩包终止程序

  // 获取项目设置的默认端口号
  const appPort = defaultPort(pm2configpath);
  dPort = appPort ? appPort : dPort;

  if (pm2.exists(productName)) {
    logger.system(`服务已存在，直接加载`);
    if (win) {
      loadUrl(win, `http://localhost:${dPort}/`,productName,()=>{
        console.log(`${productName}网页已加载完成`)
        compete();
      });
    }

    //返回port
    if (typeof(callback) == "function"){
      console.log(`${productName}项目启动端口：${dPort}`)
      callback(dPort);
    }
    return;
  }

  // 确定端口占用情况，获取可使用端口
  const canUsePort = await detectPort(dPort);
  // 修改默认port的值及pm2 config文件中的默认端口
  if (canUsePort !== dPort) {
    let pm2Conf = fs.readFileSync(pm2configpath, 'utf-8');
    pm2Conf = pm2Conf.replace(dPort, canUsePort);
    fs.writeFileSync(pm2configpath, pm2Conf);
    dPort = canUsePort;
  }

  // 记录当前window所起项目的port
  setRender(productName, { port: Number(dPort) });
  logger.system(`${productName} 项目路径 == ${projectPath} 端口号: ${dPort}`);
  // 启动服务
  pm2.start(
    { cwd: projectPath, script: `app.js`, name: productName,env:{PORT:dPort} },
    (err:any, pid:any) => {
      if (err) {
        logger.system(`pm2 err == ${err}`);
      } else {
        logger.system(`${productName}服务启动成功`);
        if (win) {
          loadUrl(win, `http://localhost:${dPort}/`,productName,()=>{
            console.log(`${productName}网页已加载完成`)
            compete();
          });
        }

        //返回port
        if (typeof(callback) == "function"){
          console.log(`${productName}项目启动端口：${dPort}`)
          callback(dPort);
        }
      }
    }
  );
}

// 复制新版本包并重启项目
export const updateProduct = (zippath:string, targetPath:string, productName:string) => {
  copydir.sync(zippath, targetPath, { utimes: true, mode: true, cover: true });
  const unzip = new Admzip(targetPath);
  unzip.extractAllTo(path.join(targetPath, `../`), true);
  if (pm2.exists(productName)) {
    console.log('当前服务存在',productName);
    let winId = getRenderIDByName(productName);
    if(!winId){
      const packageJson = fs.readJSONSync(path.join(__dirname, '../../package.json'));
      winId = getRenderIDByName(packageJson.name);
    }
    pm2.restartByName(productName);
    setTimeout(() => {
      if(winId){
        const window = BrowserWindow.fromId(winId);
        window?.reload();
      }
      logger.system('刷新成功');
    }, 3000);
  }
};

// 根据产品名称reload服务
export const reloadWindowByName = (productName:string) => {
  if (pm2.exists(productName)) {
    const winId = getRenderIDByName(productName);
    const window = BrowserWindow.fromId(winId);
    pm2.restartByName(productName);
    setTimeout(() => {
      window?.reload();
      logger.system('刷新成功');
    }, 5000);
  }
};


