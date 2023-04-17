import { app, ipcRenderer } from 'electron';
import fs from 'fs-extra';
import _ from 'lodash';
import cmd from 'node-cmd';
import path from 'path';
import compare from 'semver-compare';
import { checkPath, closeDownloadTask, downloadFile } from '../utils/download';
import { powershell } from '../utils/powershll';

//插件下载路径
let SOFTWARE_PATH: string;
//插件版本管理json路径
let SOFTWARE_JSON_PATH: string;

const remote =
  process.type === 'browser'
    ? require('@electron/remote/main')
    : require('@electron/remote');
const getCachepath = async () => {
  let appname;
  let cachePath;
  let fileLoadPath;
  if (process.type === 'browser') {
    appname = app.getName();
    cachePath = app.getPath('cache');
    fileLoadPath = global?.settingInfo?.fileLoadPath;
  } else {
    appname = await ipcRenderer.invoke('getAppName');
    cachePath = await ipcRenderer.invoke('getAppPath', 'cache');
    fileLoadPath = remote.getGlobal('settingInfo').fileLoadPath;
  }

  if (fileLoadPath) cachePath = fileLoadPath;
  console.log(`cachePath == `, cachePath);

  SOFTWARE_PATH = path.join(cachePath, `${appname}/software`);
  SOFTWARE_JSON_PATH = path.join(SOFTWARE_PATH, `software.json`);
};
getCachepath();

//获取环境变量的值
const getEnv = async (code: string) => {
  if (process.platform == 'win32') {
    let enccc = (await powershell(
      `chcp 65001;$env:ChocolateyInstall = Convert-Path "$((Get-Command choco).Path)/../..";Import-Module "$env:ChocolateyInstall/helpers/chocolateyProfile.psm1";refreshenv;ls Env:${code} |ft -wrap -AutoSize`
    ).catch((e) => {})) as string;
    enccc = enccc.replace(/\r\n/g, '').replace(/\n/g, '');
    //由于Windows ls Env:指令会根据窗口尺寸截断数据列表导致出现空格与\r\n，故在这里进行字符串处理
    let context = enccc.substring(
      enccc.indexOf('{'),
      enccc.lastIndexOf('}') + 1
    ); // {} 花括号，大括号

    if (context.length > 0) {
      const sortStr = context.match(/(.)\1*/g).sort((a: string, b: string) => {
        return b.length - a.length;
      })[0];
      if (sortStr.indexOf(' ') > -1) {
        context = context.replace(sortStr, '');
      }
      console.log(
        '%c [ context ]-65-「plugins」',
        'font-size:13px; background:#a39edc; color:#e7e2ff;',
        context
      );
      return context;
    } else {
      return '';
    }
  } else {
    const data = cmd.runSync(`source ~/.bash_profile
								printenv ${code}`);
    return data?.data || '';
  }
};

//获取插件的最新版本号
const getLatestVersion = (context: string) => {
  const versionInfo = JSON.parse(context);
  const versions = Object.keys(versionInfo);
  const latestVersion = versions.sort(compare).pop() || '';

  return latestVersion;
};
//获取环境变量中的插件信息
const getPluginInfo = async (modelcode: string) => {
  let versionVariableStr = await getEnv(modelcode);
  console.log(
    '%c [ versionVariableStr ]-84',
    'font-size:13px; background:pink; color:#bf2c9f;',
    versionVariableStr
  );
  if (modelcode === 'newaoralscan_domestic' && !versionVariableStr) {
    versionVariableStr = await getEnv('newaoralscan');
  }

  if (versionVariableStr) {
    try {
      const versionVariable = JSON.parse(versionVariableStr);
      const version = getLatestVersion(versionVariableStr);
      console.log(
        '%c [ version ]-101',
        'font-size:13px; background:pink; color:#bf2c9f;',
        version
      );
      const fullKey = versionVariable[version];
      const softwareVariableStr = await getEnv(fullKey);
      const softwareVariable = JSON.parse(softwareVariableStr);
      console.log(
        '%c [ softwareVariable ]-104',
        'font-size:13px; background:pink; color:#bf2c9f;',
        softwareVariable
      );
      const path = softwareVariable.main;
      const uninstallPath = softwareVariable.uninstall;
      const name = modelcode;
      return { path, uninstallPath, name, version };
    } catch (error) {
      console.log(`error == `, error);
      return null;
    }
  } else {
    return null;
  }
};

//获取插件信息
const plugins = (name: any) => {
  return new Promise(async (resolve, reject) => {
    if (!fs.existsSync(SOFTWARE_JSON_PATH)) {
      fs.mkdirpSync(SOFTWARE_PATH);
      fs.writeJSONSync(SOFTWARE_JSON_PATH, {});
    }
    if (!name) {
      const sfjson = fs.readJSONSync(SOFTWARE_JSON_PATH);
      console.log(
        '%c [ sfjson ]-118',
        'font-size:13px; background:pink; color:#bf2c9f;',
        sfjson
      );

      const data = {};
      const softwareArr: string[] = [];
      Object.keys(sfjson).forEach((id) => {
        if (sfjson[id].name) {
          softwareArr.push(sfjson[id].name);
        }
      });
      const promiseAll: Array<Promise<any>> = [];
      softwareArr.forEach((code) => {
        promiseAll.push(getPluginInfo(code));
      });
      const p = Promise.all(promiseAll);
      p.then((res) => {
        console.log(
          '%c [ res ]-147',
          'font-size:13px; background:pink; color:#bf2c9f;',
          res
        );
        const data = {};
        res.forEach((_p) => {
          if (_p) {
            const downloadVersions = getDownloadedPluginVersionByName(_p.name);
            data[_p.name] = {
              name: _p.name,
              path: _p.path ?? '',
              installed: !!_p?.path,
              pluginId: _.findKey(sfjson, ['id', _p.name]),
              downloadVersions,
              isDownload: checkDownloadState(
                _.get(sfjson, `${_p.name || ''}.fullname`)
              ),
              // version:_.get(sfjson,`${softwareId}.version`) ?? null,
              version: _p.version ?? '',
            };
          }
        });
        return resolve({
          status: 'success',
          data: data,
        });
      });
    }
    //区分是批量查询还是单个查询
    else if (name instanceof Array) {
      let plugins = {};
      for (let index = 0; index < name.length; index++) {
        const softwareName = name[index];
        console.log(
          '%c [ softwareName ]-149',
          'font-size:13px; background:pink; color:#bf2c9f;',
          softwareName
        );
        const sfjson = fs.readJSONSync(SOFTWARE_JSON_PATH);
        const softwareId = _.findKey(sfjson, ['name', softwareName]);
        const plugin = await getPluginInfo(softwareName);
        const downloadVersions = getDownloadedPluginVersionByName(softwareName);
        plugins[softwareName] = {
          name: softwareName,
          path: plugin?.path ?? '',
          installed: !!plugin?.path,
          pluginId: softwareId,
          downloadVersions,
          isDownload: checkDownloadState(
            _.get(sfjson, `${softwareId}.fullname`)
          ),
          // version:_.get(sfjson,`${softwareId}.version`) ?? null,
          version: plugin?.version ?? '',
        };
      }
      return resolve({
        status: 'success',
        data: plugins,
      });
    } else {
      const sfjson = fs.readJSONSync(SOFTWARE_JSON_PATH);
      const softwareId = _.findKey(sfjson, ['name', name]);
      const plugin = await getPluginInfo(name);

      const downloadVersions = getDownloadedPluginVersionByName(name);

      resolve({
        status: 'success',
        data: {
          name,
          path: plugin?.path || '',
          installed: !!plugin?.path,
          pluginId: softwareId,
          downloadVersions,
          isDownload: checkDownloadState(
            _.get(sfjson, `${softwareId}.fullname`)
          ),
          // version:_.get(sfjson,`${softwareId}.version`) ?? null,
          version: plugin?.version ?? '',
        },
      });
    }
  });
};

//获取当前名称的插件的所有版本
const getDownloadedPluginVersionByName = (name: string) => {
  const files = fs.readdirSync(SOFTWARE_PATH);
  let installationPackage: any[] = [];
  files.forEach((fileName) => {
    if (fileName.indexOf(name) > -1) {
      var ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
      var modelcode = fileName.substring(0, fileName.lastIndexOf('_'));
      var version = fileName.substring(
        fileName.lastIndexOf('_') + 1,
        fileName.lastIndexOf('.')
      );
      installationPackage.push({
        fileName: `${modelcode}${ext}`,
        fullName: fileName,
        version,
      });
    }
  });
  return installationPackage;
};

//安装插件
const installPlugin = (plugin: any) => {
  const { fileName, version } = plugin;
  console.log(
    '%c [ plugin ]-220-「plugins」',
    'font-size:13px; background:#04fd07; color:#48ff4b;',
    plugin
  );
  const softwarename = fileName.substring(0, fileName.lastIndexOf('.'));
  console.log(
    '%c [ softwarename ]-222-「plugins」',
    'font-size:13px; background:#f697c0; color:#ffdbff;',
    softwarename
  );
  var ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length);
  console.log(
    '%c [ ext ]-224-「plugins」',
    'font-size:13px; background:#47cbe6; color:#8bffff;',
    ext
  );
  const fullname = `${softwarename}_${version}${ext}`;
  console.log(
    '%c [ fullname ]-226-「plugins」',
    'font-size:13px; background:#087f8b; color:#4cc3cf;',
    fullname
  );

  let softwarepath = path.join(SOFTWARE_PATH, `${fullname}`);
  console.log(
    '%c [ softwarepath ]-225-「plugins」',
    'font-size:13px; background:#e4158b; color:#ff59cf;',
    softwarepath
  );
  if (fs.existsSync(softwarepath)) {
    cmd.run(
      process.platform == 'win32' ? softwarepath : `open ${softwarepath}`
    );
  }
};

//卸载插件
const uninstallPlugin = (name: string) => {
  return new Promise(async (resolve, reject) => {
    const pluginInfo = await getPluginInfo(name);
    console.log(
      '%c [ pluginInfo ]-175',
      'font-size:13px; background:pink; color:#bf2c9f;',
      pluginInfo
    );
    const uninstallPath = _.get(pluginInfo, 'uninstallPath');
    console.log(
      '%c [ uninstallPath ]-176',
      'font-size:13px; background:pink; color:#bf2c9f;',
      uninstallPath
    );

    if (process.platform == 'win32') {
      cmd.run(`"${uninstallPath}"`);
    } else {
      cmd.run(`rm -rf  ${uninstallPath}`);
    }

    //删除插件信息
    const sfjson = fs.readJSONSync(SOFTWARE_JSON_PATH);
    const pluginId = _.findKey(sfjson, ['name', name]);
    delete sfjson[pluginId];
    fs.writeJSONSync(SOFTWARE_JSON_PATH, sfjson);
    return resolve({
      status: 'success',
      data: 'complete',
    });
  });
};

// 全局挂载插件下载状态与下载进度
const setPluginDownloading = (modelCode:string,version:string,percent:number,downloadUrl:string)=>{
  const pluginDownloadingList = {}
  pluginDownloadingList[modelCode] = { version, percent,downloadUrl }
  if(percent == 1 ){
    setTimeout(() => {
      delete global.pluginDownloadingList[modelCode]
    }, 1000);
  }
  global.pluginDownloadingList = pluginDownloadingList
}
const getPluginDownloading = ()=>{
   return global.pluginDownloadingList
}
//下载插件
const downloadPlugin = (plugin: any, process: (process: number) => void) => {
  return new Promise((resolve, reject) => {
    const { fileName, version, downloadUrl } = plugin;

    if (!fs.pathExistsSync(SOFTWARE_PATH)) {
      fs.mkdirSync(SOFTWARE_PATH);
    }

    const softwarename = fileName.substring(0, fileName.lastIndexOf('.'));
    var ext = fileName.substring(fileName.lastIndexOf('.'), fileName.length);

    if (checkPath(SOFTWARE_PATH, true)) {
      const fullname = `${softwarename}_${version}${ext}`;

      downloadFile(
        downloadUrl,
        SOFTWARE_PATH,
        fullname,
        (percent) => {
          process(percent);
          setPluginDownloading(plugin.name,plugin.version,percent,downloadUrl)
        },
        (res: any) => {
          if (res.status != 'success') {
            return resolve(res);
          }
          writeSoftwareInfo(plugin, fullname);
          return resolve({
            status: 'success',
            data: 'complete',
          });
        }
      );
    }
  });
};

//取消下载
const closeDownloadPlugin = (plugin: any) => {
  return new Promise((resolve, reject) => {
    const { downloadUrl } = plugin;
    closeDownloadTask(downloadUrl, (res) => {
      console.log('%c [ res ]-392', 'font-size:13px; background:pink; color:#bf2c9f;', res)
      if (res.status === 'success') {
        delete global.pluginDownloadingList[plugin.modelCode]
        console.log('%c [ global.pluginDownloadingList ]-395', 'font-size:13px; background:pink; color:#bf2c9f;', global.pluginDownloadingList)
        resolve(res);
      } else {
        reject(res);
      }
    });
  });
};

//清空安装包
const clearPackage = () => {
  return new Promise((resolve, reject) => {
    const files = fs.readdirSync(SOFTWARE_PATH);
    files.forEach((filename) => {
      if (filename !== 'software.json') {
        fs.removeSync(`${SOFTWARE_PATH}/${filename}`);
      }
    });
    resolve({ status: 'success', msg: 'clear compete!' });
  });
};

//写入插件安装信息
const writeSoftwareInfo = (info: any, fullname: string) => {
  const sfjson = fs.readJSONSync(SOFTWARE_JSON_PATH);
  const pluginId = _.findKey(sfjson, ['name', info.name]);
  delete sfjson[pluginId];
  sfjson[info.id] = info;
  sfjson[info.id]['fullname'] = fullname ?? '';
  fs.writeJsonSync(SOFTWARE_JSON_PATH, sfjson);
};

//检查是否已下载
const checkDownloadState = (fullname: string) => {
  const files = fs.readdirSync(SOFTWARE_PATH);
  let isDownload = false;
  files.forEach((filename) => {
    if (filename === fullname) {
      isDownload = true;
    }
  });

  return isDownload;
};

export {
  plugins,
  installPlugin,
  downloadPlugin,
  clearPackage,
  uninstallPlugin,
  closeDownloadPlugin,
  getPluginInfo,
  getPluginDownloading
};
