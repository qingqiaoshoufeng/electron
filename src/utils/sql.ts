import Database from 'better-sqlite3';
import { app, ipcMain } from 'electron';
import path from 'path';
import  fs  from 'fs-extra';


const dbname = 'doctordesk.db';
const dbdir = path.join(__dirname,'../../db/');
let sqliteCmd = path.join(__dirname,`../bin/${(process.platform === 'darwin' ? 'mac/arm64/better-sqlite3.node' : 'win/better-sqlite3.node')}`);
if(app.isPackaged){
  if(process.platform === 'darwin'){
    sqliteCmd = path.join(__dirname,`../../bin/arm64/better-sqlite3.node`);
  }else{
    sqliteCmd = path.join(__dirname,`../../bin/better-sqlite3.node`);
  }
}

const create_table_matomos =
    `CREATE TABLE if not exists matomo
     (
         id      INTEGER PRIMARY KEY AUTOINCREMENT,
         request    varchar           NOT NULL
     );`
const create_table_userInfo =
     `CREATE TABLE if not exists userInfo
      (
          id      INTEGER PRIMARY KEY AUTOINCREMENT,
          userInfo    varchar           NOT NULL
      );`
const create_table_apiInfo =
      `CREATE TABLE if not exists apiInfo
       (
           id      INTEGER PRIMARY KEY AUTOINCREMENT,
           apiInfo    varchar           NOT NULL
       );`


class DeskDao {
  db;
  constructor () {
    const pathName = dbdir+dbname;
    try {
      console.log(`pathName == ${pathName}`);

      this.db = Database(pathName, { verbose: console.log,nativeBinding:sqliteCmd });
      this.db.exec(create_table_matomos)//执行sql命令
    } catch (error) {
      console.log('创建表失败 == ',error);
    }
    // insertMatomoRequest(this.db);
  }

  getTableInfo(tableName:string){
    var stmt = this.db.prepare(`select * from ${tableName}`).all();
    return stmt;
  }
  saveUserInfo(userInfo:string){
    this.db.exec(create_table_userInfo)
    const insert = this.db.prepare('INSERT INTO userInfo (userInfo) VALUES (@userInfo)');
    const insertMany = this.db.transaction((user:{userInfo:string}[]) => {
      for (const info of user) insert.run(info);
    });
    this.db.exec('Delete from userInfo')
    this.db.exec("update sqlite_sequence SET seq = 0 where name ='userInfo'")
    insertMany([{ userInfo}])
    // const oldUseInfo = this.getTableInfo('userInfo')
    // console.log(oldUseInfo[0].userInfo);
    // console.log('useInfo',oldUseInfo,userInfo);
  }
  saveApiInfo(apiInfo:string){
    this.db.exec(create_table_apiInfo)
    const insert = this.db.prepare('INSERT INTO userInfo (apiInfo) VALUES (@apiInfo)');
    const insertMany = this.db.transaction((apis:{apiInfo:string}[]) => {
      for (const info of apis) insert.run(info);
    });
    this.db.exec('Delete from userInfo')
    this.db.exec("update sqlite_sequence SET seq = 0 where name ='userInfo'")
    insertMany([{ apiInfo}])
  }

  getUserInfo(){
     const data = this.getTableInfo('userInfo')
     return JSON.parse(data[0].userInfo)
  }
  getApiInfo(){
    const data = this.getTableInfo('apiInfo')
    return JSON.parse(data[0].apiInfo)
 }
}

function insertMatomoRequest(db:any){

  let matomoJsonPath = path.join(__filename,`../../../db/matomo.offline.json`);
  console.log('matomoJsonPath == ',matomoJsonPath);

  const matomoJson = fs.readJSONSync(matomoJsonPath);
  let requests = matomoJson.requests;
  console.log('request = ',matomoJson.requests);

  const insert = db.prepare('INSERT INTO matomo (request) VALUES (@request)');

  //创建批量插入过程
  const insertMany = db.transaction((requests:any) => {
    for (const request of requests) insert.run({'request':request});
  });
  insertMany(requests);
}

export const saveUserInfo = ()=>{
  const createTableAndSave = async (userInfo:string)=>{

    global.userInfo =(typeof userInfo === 'string') ? JSON.parse(userInfo) : userInfo
    // console.log('global.userInfo',global.userInfo);
    global.deskDao.saveUserInfo(userInfo)
    return userInfo
  }
  ipcMain.handle('saveUserInfo',async (event:unknown,userInfo:string)=>{
    // console.log('userInfo',userInfo);

    return await createTableAndSave(userInfo)
  })
}

export const saveApiInfo = ()=>{
  const createTableAndSave = async (userInfo:string)=>{
    global.deskDao.saveApiInfo(userInfo)
    return true
  }
  ipcMain.handle('saveApiInfo',(event:unknown,apiInfo:string)=>{
    createTableAndSave(apiInfo)
  })
}

export default DeskDao;
