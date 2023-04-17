import fs from 'fs-extra'
import path from 'path'
class LangInfo {
  data:Record<string,any>
  static of(){
   return new LangInfo()
  }
  constructor(){
    this.data = {}
  }
  setLang(){

  }
  readJson(){
   const jsonInfo = fs.readJSONSync(this.getPath())
   const { en_US,ja_JP,zh_CN} = jsonInfo
  //  console.log(333,jsonInfo);
   return {en_US,ja_JP,zh_CN}
  }
  getPath(){
    const resoucePath = path.join(__dirname, '../../', `resources`); //项目目录
    const doctorDeskConfigPath =path.join(resoucePath, './doctordesk/server.conf.json')
    return doctorDeskConfigPath
  }
}


export const setLangInfo = ()=>{
  global.langInfo = LangInfo.of().readJson()
}
