# eletron template



### 安装

---

Clone仓库并安装依赖

```git
git clone --depth 1 --branch master https://git.shining3d.com/bigfront/electron-template.git [项目名称]
cd [项目名称]
npm install
```

运行开发服务

```
npm run start
```

生产打包

```
npm run package
```



### 目录解构

---

├─.eslintignore
├─.eslintrc.js
├─.gitignore
├─.npmrc
├─LICENSE
├─README.md
├─electron-builder.json  						//electron-builder打包配置文件
├─package-lock.json
├─package.json							        //electron项目包管理文件					
├─tsconfig.json
├─src
|  ├─utils													//工具类
|  |   ├─load_page.js								//通过window加载前端项目
|  |   ├─logger.ts									//日志输出
|  |   ├─render_store.ts						//记录当前渲染窗口信息
|  |   ├─window_register.ts					//注册window
|  |   ├─pm												  //启动项目服务启动工具
|  |   | ├─index.js
|  |   | └process-info.js
|  ├─main												    //electron程序主要文件
|  |  ├─main.ts										  //主进程入口文件，程序因此起
|  |  ├─menu.ts									  	//客户端菜单管理
|  |  └preload.ts										//为web提供electron能力的桥梁文件（参照BrowserWindow使用）
|  ├─__tests__											//单元测试
|  |     └App.test.tsx
├─resources									        //web项目管理文件夹
|     └passport.zip									//web项目压缩文件
├─release									          //客户端build生成目录
|    ├─build											  //客户端打包产物（exe、dmg）
|    ├─app												  //主进程打包配置及产物
|    |  ├─package.json
|    |  ├─resources								  //web端项目（根目录resources,由打包时移动到此处，便于打进exe）
|    |  |     └passport.zip
|    |  ├─dist											//主进程打包产物
|    |  |  ├─main
|    |  |  |  ├─main.js
|    |  |  |  ├─main.js.LICENSE.txt
|    |  |  |  └preload.js
├─assets												    //资源文件
|   ├─assets.d.ts
|   ├─entitlements.mac.plist
|   ├─icon.icns
├─.erb									            //项目配置及脚本
|  ├─scripts										
|  |    ├─check-port-in-use.js		  //监测可用端口
|  |    ├─clean.js									//打包前清理上次打包产物
|  |    ├─copy-resources.js					//copy web资源到打包区（release/app）
|  |    ├─delete-source-maps.js			//删除source-maps
|  |    ├─electron-rebuild.js				//重新构建
|  |    ├─install-native-dep.js			//安装web项目依赖（web依赖与electron分开管理，需单独安装）
|  |    ├─link-modules.ts						//Mac&linux 写入环境变量
|  |    └notarize.js								//打包前预处理脚本
|  ├─mocks											    //mock管理
|  |   └fileMock.js
|  ├─img
|  |  ├─erb-banner.svg
|  |  └erb-logo.png
|  ├─dll														//插件位置
|  |  └preload.js										//打包后的preload文件
|  ├─configs												
|  |    ├─.eslintrc
|  |    ├─webpack.config.base.ts				    //webpack基本配置
|  |    ├─webpack.config.main.prod.ts		    //生产模式 webpack配置
|  |    ├─webpack.config.preload.dev.ts     //开发环境 webpack配置
|  |    └webpack.paths.ts								    //路径管理





## 项目基本运行顺序(可按此顺序阅读，方便理解)

* npm run start 指向 ./src/main/main.ts ，项目从进入main.ts开始执行
* app为electron程序实例，app.whenReady()为electron程序加载完毕，此时可进入渲染逻辑
* 在app.whenReady()钩子中，创建主window（webview）加载web端资源
* 向window传入本地项目名称，项目会在resources目录下寻找对应web文件并启动服务并加载web资源
* 至此，前端页面在客户端陈旭渲染完毕
