
import type { App } from 'electron';
import path from 'path';
import DeskDao from "../utils/sql";
const fs = require('fs-extra')
const pkg = require('../../package.json');
const logger = require('./logger');
// const DeskDao = require('../utils/sql')

export const initGlobalRender = () => {
  require('@electron/remote/main').initialize();
  global.renderMap = new Map();
  global.boxVersion = pkg.version;
  global.deskDao = new DeskDao();
  logger.system(`持久化文件存储在：${global.renderMap.get('path')}`);
};
export const setRender = (name: string, param: any) => {
  const obj = Object.assign(global.renderMap?.get(name) || {}, param);
  global.renderMap?.set(name, obj);
};
export const getRenderIDByName = (name: string) => {
  if (global.renderMap?.get(name)) {
    return (global.renderMap?.get(name))?.id;
  }
  return undefined;
};

// 获取renderMap中对应key的值
export const getRenderVal = (name: string, key: string) => {
  if (global.renderMap?.get(name)) {
    return (global.renderMap?.get(name))[key];
  }
  return undefined;
};

export const removeRender = (name: string) => {
  global.renderMap?.delete(name);
};

export const clearRender = () => {
  global.renderMap?.clear();
};

export const getUserInfo = (app: App) => {
  const settingPath = path.join(app.getPath('userData'), './setting.json')

  if(!fs.existsSync(settingPath)){
    fs.writeJSONSync(settingPath,{fileLoadPath:app.getPath('cache')});
  }
  let info = fs.readJsonSync(settingPath)
  if(!info.fileLoadPath){
    info.fileLoadPath = app.getPath('cache');
    fs.writeJSONSync(settingPath,info);
  }

  return info
}

export const setUserInfo = (app: App) => {
  const settingPath = path.join(app.getPath('userData'), './setting.json')
  global.settingInfo.shortcutKeys = global.shortcutKeys
  global.settingInfo.isNoticeSound = global.isNoticeSound
  global.settingInfo.isNotice = global.isNotice
  fs.writeFileSync(settingPath, JSON.stringify(global.settingInfo))
}
