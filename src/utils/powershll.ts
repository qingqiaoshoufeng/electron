import isUndefined from "is-undefined";
import spawn from "spawno";
import isWin from "is-win";


export const powershell = (input: string, opt: { debug?: any; noprofile?: any; PSCore?: any; executionpolicy?: any; }={}, cb: ()=>void = ()=>{}) =>  {
    return new Promise((resolve, reject) => {

        opt = opt || {};
        opt.debug = isUndefined(opt.debug) ? false : opt.debug;
        opt.noprofile = isUndefined(opt.noprofile) ? true : opt.noprofile;
        opt.PSCore = isUndefined(opt.PSCore) ? false : opt.PSCore;
        const EXE_NAME = `${opt.PSCore ? 'pwsh' : 'powershell'}${isWin() ? ".exe" : ""}`;
        let args = [];

        if (opt.noprofile) {
            args.push("-NoProfile");
        }

        if (!isUndefined(opt.executionpolicy)) {
            args.push("-ExecutionPolicy", opt.executionpolicy);
        }

        args.push("-Command", "& {" + input + "}");

        let _proc = spawn(
            EXE_NAME
            , args
            , { stdio: ["ignore", "pipe", "pipe"] }
            , cb
        );

        _proc.stdout.setEncoding("utf8");
        _proc.stderr.setEncoding("utf8");
        
        _proc.on("error", (err: any) => {
            resolve('')
            _proc = null;
        });

        if (opt.debug) {
            console.log(`<${EXE_NAME}> Starting ${_proc.pid} on ${process.platform}`);
        }

        let chunks: any = [];

        _proc.stdout.on("data", (chunk: any) => {
            console.log(chunk);
            let dataStr = chunk.toString();

            if( !(dataStr.includes('Refreshing environment') || dataStr.includes('Finished')) && dataStr){
                chunks.push(dataStr);
            }
            
        });

        _proc.stderr.on("data", (err: any) => {
            console.log(err);
            //这里处理数据
            resolve('')
            _proc = null;
        });
        _proc.on("close", (code: any) => {
            if (opt.debug) {
                console.log(`<${EXE_NAME}> Process ${_proc.pid} exited with code ${code}`);
            }
            //这里处理关闭（完成）事件
            resolve(chunks.join(""))
            _proc = null;
        });
    })
}

