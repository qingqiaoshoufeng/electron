import urlUtil from 'url';
import { app, dialog } from 'electron';
import logger from '../utils/logger';
import { getPluginInfo } from "./plugins";
import fs from 'fs-extra';
import cmd from 'node-cmd';
import path from 'path';
import xml2js from 'xml2js';
import { mouthScan } from "./mouthScan";

const TempPath = path.join(app.getPath('temp'),app.getName());
let builder = new xml2js.Builder();

// doctordesk://open?name=OrthoSim&query=[{"key": "--configJsonPath","type": "json","value": {"upperPath": "c:/ftpfile/model/upper3.beb","lowerPath": "c:/ftpfile/model/lower3.beb","language": "zh_TW","doctorID": "cdb91c01-7652-586e-84b3-495cfa4e7715","hospitalID": "28860e67-f7ae-568f-96d3-81da2f67a1a3","patientName": "Ortho","savePath": "d:/ftpfile/Ortho/","phone": "86","enableODM": true,"clondPort": 1202}},{"key": "--startWay","type": "string","value": "clond"}]
const parseScheme = async (url:string)=>{

	var host = urlUtil.parse(url).host;
	var query = urlUtil.parse(url,true).query;

	//host当做事件，query为参数
	if(host === 'open' && query ){
    const pluginInfo = await getPluginInfo(query.name as string);

    if(query.name && pluginInfo){
      let scriptString = `${pluginInfo.path}`;
      if(query.queryString){
        scriptString = `${pluginInfo.path} ${query.queryString}`
      }else{
        const param = JSON.parse(query.query as string);
        param.forEach(p => {
          if(p.type == 'json' || p.type == 'xml'){
            const filePath = path.join(TempPath,`${query.name}_${p.key}.${p.type == 'json' ? 'json':'xml'}`);
            if(!fs.existsSync(filePath)){
              fs.mkdirpSync(TempPath);
            }

            if(p.type == 'json'){
              fs.writeJSONSync(filePath,p.value)
            }else{
              var xml = builder.buildObject(p.value); //将json转为xlm数据
              fs.writeFileSync(filePath, xml); //向文件内写入xml数据
            }
            scriptString  = `${scriptString} ${p.key} ${filePath}`;
          }else{
            scriptString  = `${scriptString} ${p.key} ${p.value}`;
          }
        });
      }
      logger.front(`scriptString == ${scriptString}`)
      cmd.run(scriptString)
    }
	}else if(host === 'mouthScan' && query ){
    const orderNo = query.orderNo as string;
    // mouthScan(orderNo,query,process=>{}).then(res=>{
    //   dialog.showMessageBox({title:'温馨提示',message:'扫描结果已上传完毕',type:'info',buttons:['知道了']});
    // });
  }else{
		logger.system(`暂不支持${host}事件`);
	}

  setTimeout(() => {
    app.quit();
  }, 3000);

}




const open = (pluginName:string,queryString:String)=>{

}

export {
  parseScheme
}
