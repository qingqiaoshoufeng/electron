/// 此文件处理一些通用函数
import { app, ipcMain,crashReporter } from 'electron';
import { clearCache, closeWindow, getAppNameListener, getAppPathListener, getCache, getResoucesPath, getVersionLister, notification, quitMaxWindow, registerOpenAutoStart, registOpenTools, setMaxWindow, setMinWindow, setProcessListener, shortcutRemove, shortcutSetting, triggerNotice, triggerNoticeSound, registZoomInOrOut } from '../utils/machineState';
import { getUserInfo } from '../utils/render_store';
import { machineIdSync } from 'node-machine-id';
import { hotRefreshPatch } from '../utils/hot_update';
import { saveApiInfo, saveUserInfo } from '../utils/sql';
import path from 'path'

const LOG_PATH = path.join(app.getPath('logs'), 'logs');
const startCrashReport = () => {
  crashReporter.start({
    uploadToServer: false
  });
  app.setPath('crashDumps', LOG_PATH)
}


//注册住进程监听函数
const registerMainProcessListener = ()=>{
  // 注册开机启动项监听
  registerOpenAutoStart(app, ipcMain);
  // 获取缓存体积
  getCache(app,ipcMain)
  // 清理缓存
  clearCache(app,ipcMain)
  // 通知注册
  notification(ipcMain)
  // 通知开关切换
  triggerNotice(ipcMain)
  // 通知提示音开关切换
  triggerNoticeSound(ipcMain)
  // 添加重启
  setProcessListener(ipcMain)
  // 获取版本监听
  getVersionLister(app,ipcMain)
  //添加系统路径获取函数
  getAppPathListener (app,ipcMain)
  //添加获取appname
  getAppNameListener(app,ipcMain)
  //注册增量包热更新函数
  hotRefreshPatch(ipcMain);
  // 保存登陆信息
  saveUserInfo()
  // 保存api信息
  saveApiInfo()
  // 处理window 系列监听
  setMaxWindow(ipcMain),closeWindow(ipcMain),setMinWindow(ipcMain),quitMaxWindow(ipcMain)
  // 获取resouce资源
  getResoucesPath(process,ipcMain,app)

  //初测重启窗口事件
  ipcMain.on('window-reset', function () {
    // 重启App
    app.exit(0)
    app.relaunch()
  })

}

//预执行函数
const preheating = ()=>{
  // setAppUpdateFile(app)
  // 性能监听暂时去除
  // import {generateReport} from '../utils/performanceMonitoring'
  // 获取用户默认设置
  global.settingInfo = getUserInfo(app)
  // 获取快捷键
  global.shortcutKeys = global.settingInfo.shortcutKeys || {}
  // 设置控制是否展示默认提示
  global.isNotice =global.settingInfo.isNotice || true
  // 设置控制是否使用系统提示音
  global.isNoticeSound = global.settingInfo.isNoticeSound || true
  //设置加载url失败次数字段，用于重启web服务
  global.loadFailCount= 0;

  //注册一系列监听
  registerMainProcessListener();

  //禁用窗口动画
  app.commandLine.appendSwitch("wm-window-animations-disabled");
  process.env.ELECTRON_DISABLE_SECURITY_WARNINGS = 'true';
  !global.settingInfo && (global.settingInfo = {});
  const uniqueId = machineIdSync(true);
  global.uniqueId = uniqueId; // 设置设备唯一id
  shortcutSetting(ipcMain)
  shortcutRemove(ipcMain)
  const isDevelopment = process.env.NODE_ENV === 'development' || process.env.DEBUG_PROD === 'true';

  if (isDevelopment) {
    require('electron-debug')();
  }
}

//后执行函数(处理一些可以再主进程启动后执行的函数)
const postProcessing = ()=>{
  startCrashReport()
}


export {
  preheating,
  postProcessing
}
