const { session,protocol } = require('electron');
var urlUtil = require('url');

//urls example: ['*://*/api/*','*://www.kodeclubs.com/']
export const  pageRedirect = (urls:Array<string> = ['*://*/api/*'],toPageUrl:string) => {
  //需转发的正则表达式数组
	const filter = {urls: urls}
  //拦截请求执行重定向操作
	session.defaultSession.webRequest.onBeforeRequest(filter, (details:any, callback) => {
		console.log('details url = *******************************',details.url);
		// 此处编写条件、符合条件的执行重定向,此处的’electronredirect‘为主动给url添加的标识，防止无限循环
		if(details.url.indexOf('electronredirect') == -1){
			var parsedUri = urlUtil.parse(details.url);
			// let url = details.url.replace(parsedUri.protocol+'//'+parsedUri.host,toPageUrl);//替换重定向的url
      let url = toPageUrl
			url = url + (parsedUri.query == null ? '?': '&') + 'electronredirect=1';
      console.log('url == ',url);
      callback({cancel:false, redirectURL: url })
		}else{
			callback(details);
		}
	})
}


export const listenUrl = (window:any)=>{
  //需转发的正则表达式数组
	const filter = {urls: ['http://localhost/*','https://localhost/*']}
  //拦截请求执行重定向操作
	session.defaultSession.webRequest.onBeforeRequest(filter, (details:any, callback) => {
		console.log('details url = ',details.url);
    if( details.url.indexOf('/a/scanOrder') ||
        details.url.indexOf('/u/patientManagement') ||
        details.url.indexOf('/a/order') ||
        details.url.indexOf('/plugins') ||
        details.url.indexOf('/manager') ||
        details.url.indexOf('/tools') ){
          let view = window.getBrowserView();
          view.setBounds({x:84,y:68,width: 580,height:window.getBounds().height-68});

    }else{
          let view = window.getBrowserView();
          view.setBounds({x:84,y:68,width: 0,height:0});
    }
		callback(details);

	})
}

export const redirectApi = (urls:string[])=>{
  const filter = {urls: urls}
  global.mainWindow.webContents.session.webRequest.onBeforeRequest(filter,(details:any, callback:any)=>{
    console.log('details',details.url)
    // if(details.url.indexOf('electronredirect') == -1){
			// let url = details.url.replace(parsedUri.protocol+'//'+parsedUri.host,toPageUrl);//替换重定向的url
      let parsedUri = urlUtil.parse(details.url);
      const urlList = details.url.split('/api')
      urlList[0] = 'http://bakdevapi.shining3d.io'
      const newUrl = urlList.join('/api')  + (parsedUri.query == null ? '?': '&') + 'electronredirect=1'
      // const params = {...details,redirectURL:newUrl}
    // const params = {...details,redirectURL:'http://www.baidu.com',url:'http://www.baidu.com'}
        callback({...details,redirectURL: newUrl.replace('/api','') })
      // callback({cancel:false, redirectURL: url })
		// }else{
    //   console.log('details*****',details);

		// 	callback(details);
		// }


  })
  // global.mainWindow.webContents.session.webRequest.onBeforeRequest()
}

