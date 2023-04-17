import { app, BrowserWindow, ipcMain } from 'electron';
import fs from 'fs-extra';
import path from 'path';
import { parseScheme } from "../preload/scheme";
import { handleUpdateAll } from '../utils/all_update';
import checkUpdateAll from '../utils/check_update_all';
import installCLI from '../utils/cli';
import { updateResource } from '../utils/hot_update';
import { setLangInfo } from "../utils/lang";
import { loadWebPage } from '../utils/load_page';
import logger from '../utils/logger';
import { registOpenTools, registZoomInOrOut } from '../utils/machineState';
import { getRenderIDByName, initGlobalRender, setUserInfo } from '../utils/render_store';
import { registerCreateWindowListener } from '../utils/window_register';
import MenuBuilder from './menu';
import { preheating } from './separation';
import {setMonitor,deleteMonitor,bindMonitorFile} from "../utils/dataMonitor"

//预处理函数（注册监听及初始化行为）
preheating();
const gotTheLock = app.requestSingleInstanceLock()
logger.front(`gotTheLock = ${gotTheLock} `);

if (!gotTheLock) {
  app.quit()
}else{
  //第二个窗口示例运行监听
  app.on('second-instance', (event, argv) => {
    logger.front(`进入二次唤起函数 argv ==${argv} `);
    let urlStr = process.argv.find(item=>{return item.startsWith('doctordesk://')});
    if(urlStr){
      parseScheme(urlStr)
      return;
    }

    // 禁止第二个窗口运行，直接拉起已存在窗口
    let mainWindowId=getRenderIDByName(app.getName())
    logger.front(`应用被二次唤起 mainWindowId==${mainWindowId} `);

    if (mainWindowId) {
      let  mainWin = BrowserWindow.fromId(mainWindowId);
      if(!mainWin) return;
      if (!mainWin.isVisible()) {
        mainWin.show();
      } else if (mainWin.isMinimized() || !mainWin.isFocused()) {
        mainWin.restore()
      }
      mainWin.focus()
    }
  })

  //程序被唤醒
  app.on('activate', () => {
    logger.front('系统 == activate');
    const mainID = getRenderIDByName(app.getName());
    if (!mainID) {
      createWindow();
    }else{
      (global as any).mainWindow.show();    // 添加更新监听
    }
  });


  //窗口已准备就绪
  app.whenReady().then(() => {
    logger.front(`process.argv = ${process.argv}`,)
    let urlStr = '';
    if(process.argv){
      try {
        process.argv.find(item=>{return item.startsWith('doctordesk://')})
      } catch (error) {
        logger.front(`process.argv find err == ${urlStr}`);
      }
    }
    if(urlStr){
      logger.front(`当前打开Url参数 == ${urlStr}`);
      parseScheme(urlStr)
      return;
    }
    logger.front(`确认无命令函数，执行正常渲染逻辑`);

    //注册全量更新的监听
    handleUpdateAll(ipcMain)
    // 注册快捷键打开控制台
    registOpenTools()
    initGlobalRender(); // 初始化全局存储对象

    // 注册放大、缩小
    registZoomInOrOut()

    createWindow()
    loadWebPage(null,'dental',(port)=>{
      global.dentalServerPort = port
      checkUpdateAll(ipcMain)
      installCLI(true); //添加命令行事件监听
    },()=>{
      console.log(`dental 项目加载完毕`)
    } );//加载dental项目

    // 性能监听暂时去除掉用
    // generateReport(contentTracing)
  }).catch(console.log);

  //mac系统监听
  app.on('open-url', (event, urlStr) => {
    logger.front(`进入二次唤起函数 fiddle urlStr ==${urlStr} `);
    if(urlStr){
      parseScheme(urlStr)
    }
  });


  //监听全部窗口关闭事件
  app.on('window-all-closed', () => {
    logger.front(`window-all-closed***************`);
    if (process.platform !== 'darwin') {
      app.quit();
    }
  });

  // 所有窗口关闭时退出应用.
  app.on('quit', () => {
    logger.front(`quit*******************`);
  });

  //程序将要退出
  app.on('before-quit',()=>{
    logger.front(`程序将要退出了`);
    // pm2.stopAll();
    setUserInfo(app)
    updateResource();//更新增量包
  });
}



//创建窗口
const createWindow = async () => {
  const packageJson = fs.readJSONSync(path.join(__dirname, '../../package.json'));

  app.setName(packageJson.name);
  const mainWindowId: number = registerCreateWindowListener(app.getName(), {
    url: app.getName()
    // url: 'http://localhost:8082'
  },()=>{
    setLangInfo()
    bindMonitorFile(ipcMain);
    // 开启文件监控
    setMonitor(ipcMain)
    // 关闭文件监控
    deleteMonitor(ipcMain);
    logger.system(`主应用网站加载完成`);
  });
  (global as any).mainWindow = BrowserWindow.fromId(mainWindowId);
  logger.system('获取main window',global.mainWindow?'成功':'失败');

  // 打开文件夹
  if((global as any).mainWindow){
    const menuBuilder = new MenuBuilder((global as any).mainWindow);
    menuBuilder.buildMenu();
  }
};

