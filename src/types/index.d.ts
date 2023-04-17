interface settingInfoType {
  autoStart?:boolean
  fileLoadPath?:string
  pluginLoadPath?:string
  orderSavePath?:string
  shortcutKeys?:Record<string,string>
  isNotice?:boolean
  isNoticeSound?:boolean
  directoryList:string[]
}

declare global {
  var uniqueId: string
  var renderMap:Map<string,any>
  var boxVersion:string
  var deskDao:any
  var autoStart:boolean
  var fileLoadPath:string
  var settingInfo:settingInfoType
  var dentalServerPort:number
  var loadFailCount:number
  var shortcutKeys:Record<string,string>
  var mainWindow:any
  var isNotice:boolean
  var isNoticeSound:boolean
  var apiInfo:Record<string,any>
  var userInfo:Record<string,any>
  var langInfo:Record<string,any>
  var pluginDownloadingList: Record<string,any>
  var dataMonitorInstance:{
    directoryList:string[]
    watchMap:Map<string, any>
  }
}
export { }

