import type{ ContentTracing } from 'electron';
import {pathExistsSync,removeSync} from 'fs-extra'

export const generateReport = async (tracing: ContentTracing) => {
  const options = {
    categoryFilter: '*',
    traceOptions: 'record-until-full,enable-sampling',
  };
  tracing.startRecording(options)
  await new Promise(resove=>setTimeout(resove,6000))
  const isExet = pathExistsSync('./monitorResult')
  if(isExet){
    removeSync('./monitorResult')
  }
  const path = await tracing.stopRecording('./monitorResult')

  console.log('监控文件地址',path);

};
